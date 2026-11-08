"""Read-only TikTok playback check, independent from the user's phone."""
import argparse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = "https://one-comments-api.moulinanthony60.workers.dev/catalog/tiktok"
USER_AGENT = "ONE-TikTok-Health/1.0 (+https://github.com/moulinanthony60-creator/one-mobile-alpha)"
STATUSES = ("played", "unavailable", "unknown", "pending")
LIMITATION = "Démarrage testé depuis le serveur GitHub, sans compte TikTok. Le résultat ne garantit ni toute la vidéo ni la lecture sur un autre appareil ou dans une autre région. Aucune vidéo supprimée."


class CatalogueError(Exception):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise CatalogueError("Le catalogue a redirigé la requête ; contrôle arrêté.")


def now():
    return datetime.now(timezone.utc).isoformat()


def fetch_page(url):
    try:
        # Cloudflare recommends identifying the application on workers.dev.
        with build_opener(NoRedirect()).open(Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT}), timeout=15) as response:
            raw = response.read(2_000_001)
        if len(raw) > 2_000_000:
            raise CatalogueError("Réponse du catalogue trop volumineuse.")
        return json.loads(raw)
    except HTTPError as error:
        raise CatalogueError(f"Catalogue inaccessible depuis le serveur (HTTP {error.code}). Aucune vidéo déclarée illisible.") from error
    except (URLError, TimeoutError, ValueError) as error:
        raise CatalogueError("Le catalogue n’a pas fourni une réponse JSON exploitable.") from error


def load_catalogue(fetch=fetch_page):
    entries, seen, cursors, cursor = [], set(), set(), ""
    for _ in range(100):
        page = fetch(CATALOGUE + ("?" + urlencode({"cursor": cursor}) if cursor else ""))
        if not isinstance(page, dict) or page.get("ok") is not True or not isinstance(page.get("entries"), list):
            raise CatalogueError("Réponse du catalogue invalide.")
        for row in page["entries"]:
            if not isinstance(row, dict) or not isinstance(row.get("id"), str) or not re.fullmatch(r"\d{8,24}", row["id"], flags=re.ASCII):
                raise CatalogueError("Le catalogue contient un identifiant vidéo invalide.")
            if row["id"] not in seen:
                seen.add(row["id"])
                entries.append({"id": row["id"], "status": "pending"})
            if len(entries) > 5000:
                raise CatalogueError("Le catalogue dépasse la limite de 5 000 vidéos du contrôle.")
        cursor = page.get("cursor")
        if cursor is None or cursor == "":
            return entries
        if not isinstance(cursor, str) or len(cursor) > 4096 or cursor in cursors:
            raise CatalogueError("Pagination du catalogue invalide ou répétée.")
        cursors.add(cursor)
    raise CatalogueError("Pagination incomplète : contrôle annulé.")


def totals(rows):
    result = {status: sum(row["status"] == status for row in rows) for status in STATUSES}
    result["total"] = len(rows)
    result["checked"] = len(rows) - result["pending"]
    return result


def scan(rows, probe, *, limit=0, budget=6000, sleep=time.sleep, clock=time.monotonic, checkpoint=lambda: None):
    started, consecutive_unknown = clock(), 0
    for index, row in enumerate(rows):
        if limit and index >= limit:
            return "probe"
        if clock() - started >= budget:
            return "time_budget"
        result = probe(row)
        if not isinstance(result, dict) or result.get("status") not in ("played", "unavailable", "unknown"):
            result = {"status": "unknown", "reason": "invalid_probe_result"}
        row.update(result)
        row["checkedAt"] = now()
        checkpoint()
        consecutive_unknown = consecutive_unknown + 1 if row["status"] == "unknown" else 0
        print(f"Contrôle {index + 1}/{len(rows)} : {row['status']}", flush=True)
        if row.get("reason") in ("provider_access", "rate_limit"):
            return row["reason"]
        if consecutive_unknown >= 8:
            return "repeated_unknown"
        if index < len(rows) - 1 and not (limit and index + 1 >= limit):
            sleep(3)
    return "complete"


def markdown(report):
    lines = ["# Contrôle TikTok sur serveur", "", LIMITATION, "", "Début : " + report["startedAt"], "", "État : **" + report["state"] + "**", ""]
    if report.get("error"):
        # Errors are our fixed operational messages, never response bodies or video titles.
        lines += [report["error"], ""]
    if not report["catalogueLoaded"]:
        return "\n".join(lines + ["Catalogue non chargé : le nombre de vidéos est inconnu. Aucune conclusion sur leur lecture."])
    count = totals(report["entries"])
    lines += [f"{count['checked']} / {count['total']} testées · {count['played']} démarrées · {count['unavailable']} indisponibles · {count['unknown']} incertaines · {count['pending']} non testées.", "", "| Vidéo | Résultat |", "| --- | --- |"]
    for row in report["entries"][:1000]:
        lines.append(f"| [{row['id']}](https://www.tiktok.com/@_/video/{row['id']}) | {row['status']} |")
    if len(report["entries"]) > 1000:
        lines += ["", "Les 1 000 premières lignes sont affichées ; le fichier JSON contient toutes les vidéos."]
    return "\n".join(lines) + "\n"


def write_report(report, directory):
    directory.mkdir(parents=True, exist_ok=True)
    report["counts"] = totals(report["entries"]) if report["catalogueLoaded"] else None
    temporary = directory / "report.tmp"
    temporary.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(directory / "report.json")
    (directory / "report.md").write_text(markdown(report), encoding="utf-8")


class Harness(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/":
            self.send_error(404)
            return
        body = b'<!doctype html><html><meta charset="utf-8"><title>ONE TikTok check</title><body><div id="player" style="width:325px;height:578px"></div><style>iframe{width:325px;height:578px;border:0}</style></body></html>'
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


def browser_scan(rows, *, limit, checkpoint):
    from playwright.sync_api import sync_playwright, Error as BrowserError
    server = ThreadingHTTPServer(("127.0.0.1", 0), Harness)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            try:
                page = browser.new_page(viewport={"width": 390, "height": 844})
                page.goto(f"http://127.0.0.1:{server.server_port}/", wait_until="domcontentloaded")
                page.add_script_tag(content=(ROOT / "ui/tiktok-health-core.js").read_text(encoding="utf-8"))
                blocked = []

                def response_seen(response):
                    if response.request.resource_type == "document" and response.url.startswith("https://www.tiktok.com/player/v1/") and response.status in (403, 429):
                        blocked.append(response.status)

                page.on("response", response_seen)

                def probe(row):
                    blocked.clear()
                    try:
                        result = page.evaluate("entry => ONETikTokHealthCore.inspect(entry,{container:document.getElementById('player')})", row)
                    except BrowserError:
                        result = {"status": "unknown", "reason": "browser_error"}
                    if blocked:
                        result = {"status": "unknown", "reason": "rate_limit" if 429 in blocked else "provider_access"}
                    return result

                return scan(rows, probe, limit=limit, checkpoint=checkpoint)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--probe", action="store_true", help="Vérifier l’accès et une vidéo seulement avant activation.")
    parser.add_argument("--output", type=Path, default=ROOT / "health-reports")
    args = parser.parse_args()
    report = {"version": 1, "startedAt": now(), "state": "starting", "catalogueLoaded": False, "entries": [], "scope": "Catalogue TikTok commun ONE", "environment": "GitHub Chromium / lecteur intégré sur origine locale", "limitation": LIMITATION, "mode": "probe" if args.probe else "catalogue"}
    checkpoint = lambda: write_report(report, args.output)
    checkpoint()
    try:
        report["entries"] = load_catalogue()
        report["catalogueLoaded"] = True
        report["state"] = "running"
        print(f"Catalogue chargé : {len(report['entries'])} vidéos", flush=True)
        checkpoint()
        if report["entries"]:
            report["state"] = browser_scan(report["entries"], limit=1 if args.probe else 0, checkpoint=checkpoint)
        else:
            report["state"] = "empty"
    except CatalogueError as error:
        report["state"] = "catalogue_blocked"
        report["error"] = str(error)
    except Exception as error:
        report["state"] = "execution_error"
        report["error"] = "Le navigateur serveur n’a pas pu terminer le contrôle (" + type(error).__name__ + ")."
    finally:
        report["finishedAt"] = now()
        checkpoint()
        print(markdown(report).split("| Vidéo")[0], flush=True)
    if report["state"] not in ("complete", "empty", "probe"):
        return 2
    return 1 if any(row["status"] in ("unavailable", "unknown") for row in report["entries"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
