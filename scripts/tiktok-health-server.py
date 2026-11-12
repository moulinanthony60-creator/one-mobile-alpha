"""Resumable playback checks; no writes to TikTok or the ONE database."""
import argparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import threading
import time
import uuid
import tiktok_health_state as history
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = "https://one-comments-api.moulinanthony60.workers.dev/catalog/tiktok"
USER_AGENT = "ONE-TikTok-Health/1.0 (+https://github.com/moulinanthony60-creator/one-mobile-alpha)"
STATUSES = ("played", "unavailable", "unknown", "pending")
LIMITATION = "Démarrage testé depuis GitHub, sans compte TikTok : deux secondes de progression, pas la vidéo entière. Le résultat peut varier selon l’appareil ou la région. Retrait réversible du fil ONE après trois confirmations espacées d’au moins six heures ; aucune suppression sur TikTok ni dans la base ONE."


class CatalogueError(Exception):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise CatalogueError("Le catalogue a redirigé la requête ; contrôle arrêté.")


def now():
    return datetime.now(timezone.utc).isoformat()


def retry_after(value):
    try:
        if str(value).isdigit():
            return min(int(value), 365 * 86400)
        return max(0, min(int(parsedate_to_datetime(value).timestamp() - time.time()), 365 * 86400))
    except (ValueError, TypeError, OverflowError):
        return 0


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


def scan(rows, probe, *, limit=0, budget=2400, sleep=time.sleep, clock=time.monotonic, checkpoint=lambda: None, run_id=None, interval=10):
    started, consecutive_unknown = clock(), 0
    for index, row in enumerate(rows):
        if limit and index >= limit:
            return "batch_limit"
        if clock() - started >= budget:
            return "time_budget"
        result = probe(row)
        if not isinstance(result, dict) or result.get("status") not in ("played", "unavailable", "unknown"):
            result = {"status": "unknown", "reason": "invalid_probe_result"}
        if result.get("status") == "unavailable" and not (result.get("code") == 1001 and result.get("reason") == "invalid_video"):
            result = {"status": "unknown", "reason": "unconfirmed_unavailability"}
        for key in ("reason", "code", "seconds", "retryAfterSeconds"):
            row.pop(key, None)
        row.update({k: result[k] for k in ("status", "reason", "code", "seconds", "retryAfterSeconds") if k in result})
        row["checkedAt"] = now()
        row["attemptRun"] = run_id
        checkpoint()
        consecutive_unknown = consecutive_unknown + 1 if row["status"] == "unknown" and row.get("reason") != "image_post" else 0
        print(f"Contrôle {index + 1}/{len(rows)} : {row['status']} · {row.get('reason', 'unknown')} · code {row.get('code', '—')}", flush=True)
        if row.get("reason") in ("provider_access", "rate_limit"):
            return row["reason"]
        if consecutive_unknown >= 8:
            return "repeated_unknown"
        if index < len(rows) - 1 and not (limit and index + 1 >= limit):
            sleep(interval)
    return "complete"


def markdown(report):
    lines = ["# Contrôle TikTok sur serveur", "", LIMITATION, "", "Début : " + report["startedAt"], "", "État : **" + report["state"] + "**", ""]
    if report.get("error"):
        # Errors are our fixed operational messages, never response bodies or video titles.
        lines += [report["error"], ""]
    if not report["catalogueLoaded"]:
        return "\n".join(lines + ["Catalogue non chargé : le nombre de vidéos est inconnu. Aucune conclusion sur leur lecture."])
    count = totals(report["entries"])
    lines += [f"Derniers résultats cumulés : {count['checked']} / {count['total']} testées · {count['played']} démarrées · {count['unavailable']} indisponibles · {count['unknown']} incertaines · {count['pending']} non testées.",
              f"Cette exécution : {report.get('testedThisRun', 0)} tests. Retirées du fil : {report.get('hiddenCount', 0)}.", "", "| Vidéo | Résultat | Motif | Dernier contrôle |", "| --- | --- | --- | --- |"]
    for row in report["entries"][:1000]:
        lines.append(f"| [{row['id']}](https://www.tiktok.com/@_/video/{row['id']}) | {row['status']} | {row.get('reason', '—')} | {row.get('checkedAt', '—')} |")
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


def browser_scan(rows, *, limit, checkpoint, run_id):
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
                        blocked.append((response.status, retry_after(response.headers.get('retry-after'))))

                page.on("response", response_seen)

                def probe(row):
                    blocked.clear()
                    try:
                        result = page.evaluate("entry => ONETikTokHealthCore.inspect(entry,{container:document.getElementById('player'),timeoutMs:30000,minSeconds:2})", row)
                    except BrowserError:
                        result = {"status": "unknown", "reason": "browser_error"}
                    if blocked:
                        result = {"status": "unknown", "reason": "rate_limit" if any(status == 429 for status, _ in blocked) else "provider_access", "retryAfterSeconds": max(delay for _, delay in blocked)}
                    return result

                return scan(rows, probe, limit=limit, checkpoint=checkpoint, run_id=run_id)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--probe", action="store_true", help="Vérifier l’accès et une vidéo seulement avant activation.")
    parser.add_argument("--output", type=Path, default=ROOT / "health-reports")
    parser.add_argument("--state", type=Path, help="Historique validé du contrôle précédent.")
    parser.add_argument("--batch-size", type=int, default=40)
    args = parser.parse_args()
    if not 1 <= args.batch_size <= 100:
        parser.error("Le lot doit contenir de 1 à 100 vidéos.")
    run_id = os.environ.get("GITHUB_RUN_ID") or str(uuid.uuid4())
    previous = None
    report = {"version": 2, "runId": run_id, "startedAt": now(), "state": "starting", "catalogueLoaded": False, "entries": [], "scope": "Catalogue TikTok commun ONE", "environment": "GitHub Chromium / lecteur intégré sur origine locale", "limitation": LIMITATION, "mode": "probe" if args.probe else "catalogue"}

    def checkpoint():
        report["testedThisRun"] = sum(row.get("attemptRun") == run_id for row in report["entries"])
        if previous is not None and report["catalogueLoaded"]:
            state = previous if history.epoch(previous.get("notBefore")) > time.time() else history.finalize(previous, report["entries"], run_id, report["startedAt"], report["state"], time.time())
            report["hiddenCount"] = len(history.manifest(state)["entries"])
            # A probe is diagnostic only and cannot affect the shared withdrawal list.
            if not args.probe:
                history.save(state, args.output)
        write_report(report, args.output)

    checkpoint()
    try:
        previous = history.load(args.state)
        report["entries"] = history.entries(load_catalogue(), previous)
        report["catalogueLoaded"] = True
        report["state"] = "running"
        print(f"Catalogue chargé : {len(report['entries'])} vidéos", flush=True)
        checkpoint()
        timestamp = time.time()
        if history.epoch(previous.get("notBefore")) > timestamp:
            report["state"] = "cooldown"
            report["error"] = "Pause demandée après un contrôle non concluant. Reprise au plus tôt : " + previous["notBefore"]
        elif report["entries"]:
            queue = history.due(report["entries"], timestamp)
            # Recheck one previously working video when assessing repeat failures.
            controls = [row for row in report["entries"] if row["status"] == "played"]
            if queue and controls and any(row["status"] == "unavailable" for row in queue):
                control = max(controls, key=lambda row: history.epoch(row.get("checkedAt")))
                queue = [control] + [row for row in queue if row["id"] != control["id"]]
            report["state"] = browser_scan(queue, limit=1 if args.probe else args.batch_size, checkpoint=checkpoint, run_id=run_id) if queue else "up_to_date"
            if args.probe and report["state"] == "batch_limit":
                report["state"] = "probe"
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
    if report["state"] not in ("complete", "empty", "probe", "batch_limit", "up_to_date", "cooldown"):
        return 2
    return 1 if any(row.get("attemptRun") == run_id and row["status"] in ("unavailable", "unknown") for row in report["entries"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
