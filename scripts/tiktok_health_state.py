"""Persistent playback evidence. Only spaced INVALID_VIDEO confirmations hide a link."""
from datetime import datetime, timezone
import json
from pathlib import Path
import re

MIN_GAP = 6 * 3600
HEALTHY_TTL = 7 * 24 * 3600
THRESHOLD = 3
MAX_ROWS = 5000


def epoch(value):
    try:
        return datetime.fromisoformat(value).timestamp()
    except (ValueError, TypeError, OverflowError):
        return 0


def iso(value):
    return datetime.fromtimestamp(value, timezone.utc).isoformat()


def empty():
    return {"version": 2, "records": {}, "notBefore": None}


def load(path):
    if path is None:
        return empty()
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("version") != 2 or not isinstance(data.get("records"), dict) or len(data["records"]) > MAX_ROWS:
        raise ValueError("Historique de contrôle invalide ; aucune remise à zéro automatique.")
    for key, row in data["records"].items():
        if not re.fullmatch(r"\d{8,24}", key, re.ASCII) or not isinstance(row, dict):
            raise ValueError("Historique de contrôle invalide.")
        if row.get("status") not in ("played", "unavailable", "unknown"):
            raise ValueError("État vidéo invalide.")
        if type(row.get("confirmations", 0)) is not int or not 0 <= row.get("confirmations", 0) <= THRESHOLD:
            raise ValueError("Compteur de confirmation invalide.")
        runs = row.get("confirmationRuns", [])
        if not isinstance(runs, list) or len(runs) > THRESHOLD or any(not isinstance(run, str) for run in runs) or len(set(runs)) != len(runs):
            raise ValueError("Exécutions de confirmation invalides.")
        if not epoch(row.get("checkedAt")):
            raise ValueError("Date de contrôle invalide.")
    return data


def entries(catalogue, state):
    return [{**state["records"].get(row["id"], {}), "id": row["id"],
             "status": state["records"].get(row["id"], {}).get("status", "pending")} for row in catalogue]


def due(rows, timestamp):
    def ready(row):
        ttl = HEALTHY_TTL if row["status"] == "played" or row.get("reason") == "image_post" else MIN_GAP
        return row["status"] == "pending" or timestamp - epoch(row.get("checkedAt")) >= ttl
    return sorted((row for row in rows if ready(row)), key=lambda row: epoch(row.get("checkedAt")))


def finalize(state, rows, run_id, started_at, stop_reason, timestamp):
    """The run must play at least one video before it can add unavailability strikes."""
    tested = [row for row in rows if row.get("attemptRun") == run_id]
    healthy = any(row["status"] == "played" and row.get("reason") == "time_advanced" and row.get("seconds", 0) >= 2 for row in tested)
    records = {}
    for row in rows:
        key = row["id"]
        old = state["records"].get(key, {})
        if row.get("attemptRun") != run_id:
            if old:
                records[key] = old
            continue
        record = {k: row[k] for k in ("status", "reason", "code", "seconds", "checkedAt") if k in row}
        record.update({k: old[k] for k in ("confirmations", "firstUnavailableAt", "lastUnavailableAt", "confirmationRun", "confirmationRuns", "hiddenAt") if k in old})
        record["confirmations"] = old.get("confirmations", 0)
        if row["status"] == "played":
            record["confirmations"] = 0
            for field in ("firstUnavailableAt", "lastUnavailableAt", "confirmationRun", "confirmationRuns", "hiddenAt"):
                record.pop(field, None)
        elif (healthy and row["status"] == "unavailable" and row.get("code") == 1001
              and row.get("reason") == "invalid_video" and old.get("confirmationRun") != run_id and run_id not in old.get("confirmationRuns", [])
              and (not old.get("lastUnavailableAt") or timestamp - epoch(old["lastUnavailableAt"]) >= MIN_GAP)):
            record["confirmations"] = min(THRESHOLD, record["confirmations"] + 1)
            record.setdefault("firstUnavailableAt", row["checkedAt"])
            record["lastUnavailableAt"] = row["checkedAt"]
            record["confirmationRun"] = run_id
            record["confirmationRuns"] = (old.get("confirmationRuns", []) + [run_id])[-THRESHOLD:]
            if record["confirmations"] >= THRESHOLD:
                record.setdefault("hiddenAt", row["checkedAt"])
        records[key] = record
    delay = 24 * 3600 if stop_reason in ("provider_access", "rate_limit") else MIN_GAP if stop_reason == "repeated_unknown" else 0
    delay = max([delay] + [row.get("retryAfterSeconds", 0) for row in tested])
    return {"version": 2, "records": records, "notBefore": iso(timestamp + delay) if delay else None,
            "updatedAt": iso(timestamp), "lastRun": run_id, "lastRunStartedAt": started_at,
            "lastStopReason": stop_reason, "healthyPlaybackObserved": healthy}


def manifest(state):
    hidden = []
    for key, row in state["records"].items():
        first, last = epoch(row.get("firstUnavailableAt")), epoch(row.get("lastUnavailableAt"))
        if row.get("hiddenAt") and row.get("confirmations") == THRESHOLD and first and last - first >= 2 * MIN_GAP:
            hidden.append({"id": key, "reason": "invalid_video", "code": 1001, "confirmations": THRESHOLD,
                           "firstUnavailableAt": row["firstUnavailableAt"], "lastUnavailableAt": row["lastUnavailableAt"]})
    return {"version": 1, "generatedAt": state.get("updatedAt"), "entries": hidden}


def save(state, directory):
    directory.mkdir(parents=True, exist_ok=True)
    for name, data in (("state.json", state), ("hidden.json", manifest(state))):
        tmp = directory / (name + ".tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        tmp.replace(directory / name)
