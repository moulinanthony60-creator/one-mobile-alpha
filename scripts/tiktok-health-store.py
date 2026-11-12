"""Keep health data on one dedicated branch; never edit application code or main."""
import argparse
import base64
import json
import os
from pathlib import Path
import re
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import tiktok_health_state as history

BRANCH = "one-tiktok-health-data"


def request(method, path, data=None):
    repo = os.environ["GITHUB_REPOSITORY"]
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
        raise ValueError("Dépôt invalide.")
    headers = {"Accept": "application/vnd.github+json", "Authorization": "Bearer " + os.environ["GH_TOKEN"],
               "User-Agent": "ONE-TikTok-Health/2.0", "X-GitHub-Api-Version": "2022-11-28"}
    payload = json.dumps(data).encode() if data is not None else None
    if payload is not None:
        headers["Content-Type"] = "application/json"
    with urlopen(Request("https://api.github.com/repos/" + repo + path, data=payload, headers=headers, method=method), timeout=30) as response:
        return json.load(response)


def head(api=request):
    try:
        return api("GET", "/git/ref/heads/" + BRANCH)["object"]["sha"]
    except HTTPError as error:
        if error.code == 404:
            return None
        raise


def restore(directory, api=request):
    directory.mkdir(parents=True, exist_ok=True)
    sha = head(api)
    if sha:
        response = api("GET", "/contents/state.json?ref=" + sha)
        if response.get("encoding") != "base64":
            raise ValueError("Historique distant inexploitable.")
        raw = base64.b64decode(response["content"])
        if len(raw) > 5_000_000:
            raise ValueError("Historique distant trop volumineux.")
        (directory / "state.json").write_bytes(raw)
        history.load(directory / "state.json")
    else:
        history.save(history.empty(), directory)
    (directory / "base.json").write_text(json.dumps({"sha": sha}), encoding="utf-8")
    print("Historique récupéré." if sha else "Premier contrôle : historique initialisé.")


def publish(directory, base_directory, api=request):
    if os.environ.get("GITHUB_REF") != "refs/heads/main":
        raise ValueError("Publication réservée à main.")
    state = history.load(directory / "state.json")
    sha = json.loads((base_directory / "base.json").read_text())["sha"]
    if head(api) != sha:
        raise ValueError("Historique modifié par un autre contrôle ; publication annulée.")
    files = {"state.json": state, "hidden.json": history.manifest(state)}
    tree = api("POST", "/git/trees", {"tree": [
        {"path": path, "type": "blob", "mode": "100644", "content": json.dumps(data, ensure_ascii=False, indent=2) + "\n"}
        for path, data in files.items()]})
    commit = api("POST", "/git/commits", {"message": "Update TikTok playback evidence", "tree": tree["sha"], "parents": [sha] if sha else []})
    if sha:
        api("PATCH", "/git/refs/heads/" + BRANCH, {"sha": commit["sha"], "force": False})
    else:
        api("POST", "/git/refs", {"ref": "refs/heads/" + BRANCH, "sha": commit["sha"]})
    print("Historique et retraits publiés sur la branche de données.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["restore", "publish"])
    parser.add_argument("--directory", type=Path, default=Path("health-reports"))
    parser.add_argument("--base-directory", type=Path, default=Path("health-previous"))
    args = parser.parse_args()
    try:
        if args.action == "restore":
            restore(args.base_directory)
        else:
            publish(args.directory, args.base_directory)
    except Exception as error:
        # Never log credentials, request headers, response bodies or provider HTML.
        print("Synchronisation de l’historique impossible (" + type(error).__name__ + "). Aucune publication forcée.")
        raise SystemExit(2)
