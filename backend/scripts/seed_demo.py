"""Fill the analytics store with 7 days of SYNTHETIC data so every widget has something to show.

1. Stop the backend.  2. Run from backend/:  python scripts/seed_demo.py  3. Start the backend.
To go back to real data only: stop the backend and delete backend/data/history_minutes.json
"""
import json
import math
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from config import DATA_DIR, OUTDOOR_CO2_PPM  # noqa: E402

DAYS = 7
rng = random.Random(7)
end = datetime.now().replace(second=0, microsecond=0) - timedelta(minutes=1)
t = end - timedelta(days=DAYS)


def occupants(ts: datetime) -> int:
    if ts.weekday() >= 5:
        return 0
    h = ts.hour + ts.minute / 60
    if 9 <= h < 12:
        return 5
    if 12 <= h < 13:
        return 2
    if 13 <= h < 14:
        return 4
    if 14 <= h < 16:
        return 12          # afternoon meeting
    if 16 <= h < 17.5:
        return 4
    return 0


co2, pm = OUTDOOR_CO2_PPM + 20.0, 7.0
rows = []
while t <= end:
    n = occupants(t)
    h = t.hour + t.minute / 60
    ach = 3.5 if (17.5 <= h < 18.2 or 8.0 <= h < 8.4) else 1.8   # weak purge
    purifier = 15.5 <= h < 16.5

    co2 += 3.0 * n - (ach / 60.0) * (co2 - OUTDOOR_CO2_PPM) + rng.uniform(-3, 3)
    co2 = max(OUTDOOR_CO2_PPM, co2)
    pm += 0.12 * n - (0.3 if purifier else 0.04) * (pm - 5.0) + rng.uniform(-0.3, 0.3)
    pm = max(2.0, pm)

    z = (co2 - 900) / 200 + (pm - 20) / 12
    risk = 100 / (1 + math.exp(-z))
    disease = ("No Significant Risk" if risk < 40
               else "Bronchitis Or Irritation" if risk < 70 else "Viral Infection")

    rows.append({"t": t.isoformat(timespec="seconds"), "co2": round(co2, 1),
                 "pm25": round(pm, 2), "risk": round(risk, 1), "disease": disease})
    t += timedelta(minutes=1)

DATA_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / "history_minutes.json").write_text(json.dumps({"minutes": rows}), encoding="utf-8")
print(f"Wrote {len(rows)} synthetic minutes to {DATA_DIR / 'history_minutes.json'}")