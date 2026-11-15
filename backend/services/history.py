import json
from collections import Counter, deque
from datetime import datetime, timedelta
from threading import Lock

from config import DATA_DIR, MAX_HISTORY, MINUTE_RETENTION_DAYS
from schemas import HistoryPoint, Prediction, SensorReading

# live buffer: 5-second readings, about 1 hour
_buffer: deque[HistoryPoint] = deque(maxlen=MAX_HISTORY)

# long-term store: one averaged point per minute
_minutes: deque[dict] = deque(maxlen=MINUTE_RETENTION_DAYS * 24 * 60)
_current: dict | None = None      # minute still being filled
_lock = Lock()
_FILE = DATA_DIR / "history_minutes.json"


def _finalize(c: dict) -> dict:
    n = c["n"]
    return {
        "t": c["t"].isoformat(timespec="seconds"),
        "co2": round(c["co2"] / n, 1),
        "pm25": round(c["pm25"] / n, 2),
        "risk": round(c["risk"] / n, 1),
        "disease": c["dis"].most_common(1)[0][0],
    }


def push(s: SensorReading, p: Prediction) -> None:
    global _current
    now = datetime.now()
    point = HistoryPoint(
        timestamp=now.isoformat(timespec="seconds"),
        temperature=s.temperature_C,
        humidity=s.humidity_pct,
        pm25=s.pm2_5_ug_m3,
        pm10=s.pm10_ug_m3,
        co2=s.co2_ppm,
        voc=s.voc_a_u,
        aqi=s.aqi,
        exposure=s.exposure_hours,
        risk_prob=round(p.risk_probability * 100, 1),
        disease=p.disease_display,
    )
    key = now.replace(second=0, microsecond=0)

    with _lock:
        _buffer.append(point)

        if _current is None or _current["t"] != key:
            if _current is not None and _current["n"]:
                _minutes.append(_finalize(_current))
            _current = {"t": key, "n": 0, "co2": 0.0, "pm25": 0.0, "risk": 0.0, "dis": Counter()}

        c = _current
        c["n"] += 1
        c["co2"] += s.co2_ppm
        c["pm25"] += s.pm2_5_ug_m3
        c["risk"] += p.risk_probability * 100
        c["dis"][p.disease_display] += 1


def get(minutes: int | None = None) -> list[HistoryPoint]:
    with _lock:
        points = list(_buffer)
    if minutes:
        cutoff = datetime.now() - timedelta(minutes=minutes)
        points = [p for p in points if datetime.fromisoformat(p.timestamp) >= cutoff]
    return points


def minute_points(start: datetime, end: datetime) -> list[dict]:
    """1-minute averages between start and end, oldest first (includes the minute in progress)."""
    with _lock:
        rows = list(_minutes)
        if _current is not None and _current["n"]:
            rows.append(_finalize(_current))
    s = start.isoformat(timespec="seconds")
    e = end.isoformat(timespec="seconds")
    return [r for r in rows if s <= r["t"] <= e]


def load() -> None:
    if not _FILE.exists():
        return
    try:
        rows = json.loads(_FILE.read_text(encoding="utf-8"))["minutes"]
    except Exception as e:
        print(f"History load error: {e}")
        return
    cutoff = (datetime.now() - timedelta(days=MINUTE_RETENTION_DAYS)).isoformat(timespec="seconds")
    with _lock:
        _minutes.clear()
        _minutes.extend(r for r in rows if r["t"] >= cutoff)
    print(f"History loaded: {len(_minutes)} minutes")


def save() -> None:
    with _lock:
        rows = list(_minutes)
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        tmp = _FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps({"minutes": rows}), encoding="utf-8")
        tmp.replace(_FILE)
    except Exception as e:
        print(f"History save error: {e}")