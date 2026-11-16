"""Temporary feed masking, cancelled by recent playback observations from ONE."""
from datetime import datetime, timezone
import json
from pathlib import Path
import re

MIN_GAP = 6 * 3600
HEALTHY_TTL = 7 * 24 * 3600
THRESHOLD = 3
MAX_ROWS = 5000
APP_TTL = 7 * 86400
HIDE_TTL = 86400


def app_snapshot(state, payload, timestamp):
    """Reject partial/stale telemetry; missing telemetry always disables masking."""
    snapshot = {"available": False, "checkedAt": iso(timestamp)}
    try:
        generated, started = epoch(payload.get("generatedAt")), epoch(payload.get("startedAt"))
        rows = payload.get("entries")
        if (payload.get("ok") is not True or payload.get("version") != 1
                or payload.get("policy") != "temporary-v1" or not generated or abs(timestamp-generated) > 300
                or not started or started > generated or not isinstance(rows, list) or len(rows) > MAX_ROWS):
            raise ValueError()
        played = {}
        for row in rows:
            key, at = row.get("id"), epoch(row.get("playedAt"))
            if (not isinstance(key, str) or not re.fullmatch(r"\d{8,24}", key, re.ASCII)
                    or not at or not started <= at <= generated or generated-at > APP_TTL or key in played):
                raise ValueError()
            played[key] = row["playedAt"]
        snapshot.update(available=True, startedAt=payload["startedAt"], played=played)
    except (AttributeError, TypeError, ValueError):
        pass
    result = {**state, "appEvidence": snapshot, "records": {key: dict(row) for key, row in state["records"].items()}}
    if snapshot["available"]:
        for key, record in result["records"].items():
            last_played = epoch(snapshot["played"].get(key))
            # Neither pre-collection failures nor failures before a playback can count.
            if (epoch(record.get("firstUnavailableAt")) < epoch(snapshot["startedAt"])
                    or last_played > epoch(record.get("lastUnavailableAt"))
                    or (last_played and timestamp-last_played < APP_TTL)):
                record["confirmations"] = 0
                for field in ("firstUnavailableAt", "lastUnavailableAt", "confirmationRun", "confirmationRuns", "hiddenAt"):
                    record.pop(field, None)
    return result


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
                records[key] = {k: v for k, v in old.items() if k != "hiddenAt"}
            continue
        record = {k: row[k] for k in ("status", "reason", "code", "seconds", "checkedAt") if k in row}
        record.update({k: old[k] for k in ("confirmations", "firstUnavailableAt", "lastUnavailableAt", "confirmationRun", "confirmationRuns") if k in old})
        record["confirmations"] = old.get("confirmations", 0)
        if row["status"] == "played":
            record["confirmations"] = 0
            for field in ("firstUnavailableAt", "lastUnavailableAt", "confirmationRun", "confirmationRuns", "hiddenAt"):
                record.pop(field, None)
        elif (healthy and row["status"] == "unavailable" and row.get("code") == 1001
              and row.get("reason") == "invalid_video" and old.get("confirmationRun") != run_id and run_id not in old.get("confirmationRuns", [])
              and not (epoch(state.get("appEvidence", {}).get("played", {}).get(key)) and timestamp - epoch(state["appEvidence"]["played"][key]) < APP_TTL)
              and (not old.get("lastUnavailableAt") or timestamp - epoch(old["lastUnavailableAt"]) >= MIN_GAP)):
            record["confirmations"] = min(THRESHOLD, record["confirmations"] + 1)
            record.setdefault("firstUnavailableAt", row["checkedAt"])
            record["lastUnavailableAt"] = row["checkedAt"]
            record["confirmationRun"] = run_id
            record["confirmationRuns"] = (old.get("confirmationRuns", []) + [run_id])[-THRESHOLD:]
        records[key] = record
    delay = 24 * 3600 if stop_reason in ("provider_access", "rate_limit") else MIN_GAP if stop_reason == "repeated_unknown" else 0
    delay = max([delay] + [row.get("retryAfterSeconds", 0) for row in tested])
    return {"version": 2, "records": records, "notBefore": iso(timestamp + delay) if delay else None,
            "updatedAt": iso(timestamp), "lastRun": run_id, "lastRunStartedAt": started_at,
            "lastStopReason": stop_reason, "healthyPlaybackObserved": healthy,
            "appEvidence": state.get("appEvidence", {"available": False})}


def review_candidates(state):
    """Repeated server signals require review; they are not withdrawal authorization."""
    candidates = []
    for key, row in state["records"].items():
        first, last = epoch(row.get("firstUnavailableAt")), epoch(row.get("lastUnavailableAt"))
        if row.get("confirmations") == THRESHOLD and first and last - first >= 2 * MIN_GAP:
            candidates.append({"id": key, "reason": "invalid_video", "code": 1001, "confirmations": THRESHOLD,
                           "firstUnavailableAt": row["firstUnavailableAt"], "lastUnavailableAt": row["lastUnavailableAt"]})
    return candidates


def manifest(state):
    stamp = epoch(state.get("updatedAt"))
    evidence = state.get("appEvidence", {})
    checked, started = epoch(evidence.get("checkedAt")), epoch(evidence.get("startedAt"))
    active = evidence.get("available") is True and stamp and started and 0 <= stamp-checked <= 3600
    rows = []
    if active:
        for row in review_candidates(state):
            record = state["records"][row["id"]]
            last, first = epoch(row["lastUnavailableAt"]), epoch(row["firstUnavailableAt"])
            played = epoch(evidence.get("played", {}).get(row["id"]))
            # Only a current explicit failure can renew a 24-hour mask.
            # Legacy strikes and unknown/server/network errors cannot do so.
            if (record.get("status") == "unavailable" and record.get("reason") == "invalid_video" and record.get("code") == 1001
                    and first >= started and last <= stamp < last+HIDE_TTL
                    and (not played or stamp-played >= APP_TTL)):
                rows.append({**row, "hiddenUntil": iso(last+HIDE_TTL)})
    return {"version": 2, "generatedAt": state.get("updatedAt"), "entries": rows,
            "withdrawalPolicy": "temporary-v1", "appEvidenceAvailable": bool(active)}


def save(state, directory):
    directory.mkdir(parents=True, exist_ok=True)
    for name, data in (("state.json", state), ("hidden.json", manifest(state))):
        tmp = directory / (name + ".tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        tmp.replace(directory / name)
