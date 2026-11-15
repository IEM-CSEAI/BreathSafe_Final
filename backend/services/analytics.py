import math
from bisect import bisect_right
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta

from config import (
    ACH_TARGET, CO2_LIMIT_PPM, DOSE_SHIFT_HOURS,
    HEATMAP_FIRST_HOUR, HEATMAP_LAST_HOUR, OUTDOOR_CO2_PPM,
)
from schemas import AnalyticsEvent, Dose, DoseBucket, HeatCell, Insight, Ventilation


# ---------------------------------------------------------------- helpers
def downsample(pts: list[dict], target: int = 480) -> list[dict]:
    n = len(pts)
    if n <= target:
        return pts
    k = math.ceil(n / target)
    out = []
    for i in range(0, n, k):
        chunk = pts[i:i + k]
        m = len(chunk)
        out.append({
            "t": chunk[0]["t"],
            "co2": round(sum(p["co2"] for p in chunk) / m, 1),
            "pm25": round(sum(p["pm25"] for p in chunk) / m, 2),
            "risk": round(sum(p["risk"] for p in chunk) / m, 1),
            "disease": Counter(p["disease"] for p in chunk).most_common(1)[0][0],
        })
    return out


def _lookback(ts: list[datetime], i: int, minutes: int, slack: int = 5) -> int | None:
    """Index of the point about `minutes` before point i (None if there is a data gap)."""
    j = bisect_right(ts, ts[i] - timedelta(minutes=minutes)) - 1
    if j < 0 or j >= i:
        return None
    gap = (ts[i] - ts[j]).total_seconds() / 60
    return j if gap <= minutes + slack else None


def _runs(pts, ts, pred, min_minutes: float, max_gap: int = 3) -> list[tuple[int, int]]:
    """Stretches where pred(point) stays true, at least min_minutes long."""
    runs, start, last = [], None, None
    for i, p in enumerate(pts):
        ok = pred(p)
        if ok and start is not None and (ts[i] - ts[last]).total_seconds() > max_gap * 60:
            runs.append((start, last))
            start = None
        if ok:
            if start is None:
                start = i
            last = i
        elif start is not None:
            runs.append((start, last))
            start = None
    if start is not None:
        runs.append((start, last))
    return [(s, e) for s, e in runs if (ts[e] - ts[s]).total_seconds() / 60 >= min_minutes]


def latest_decay(pts, ts, key: str, base: float = 0.0, tol: float = 8.0,
                 min_minutes: float = 8.0, min_drop: float = 80.0,
                 floor_abs: float = 30.0, floor_frac: float = 0.1,
                 max_gap: int = 3) -> tuple[int, int] | None:
    """Most recent stretch where `key` only falls. Returns (start, end) indices.

    The stretch is trimmed to the part that is still clearly above `base`, so a decay that
    ends at the floor does not blow up the logarithm used for ACH."""
    v = [p[key] for p in pts]
    n = len(v)
    best = None
    i = 0
    while i < n - 1:
        j = i
        while (j + 1 < n and v[j + 1] <= v[j] + tol
               and (ts[j + 1] - ts[j]).total_seconds() <= max_gap * 60):
            j += 1
        if j > i:
            peak = max(v[i:j + 1])
            s = max(k for k in range(i, j + 1) if v[k] >= peak - 2 * tol)
            floor = base + max(floor_abs, floor_frac * (v[s] - base))
            above = [k for k in range(s, j + 1) if v[k] >= floor]
            e = above[-1] if above else s
            dur = (ts[e] - ts[s]).total_seconds() / 60
            if e > s and dur >= min_minutes and v[s] - v[e] >= min_drop:
                best = (s, e)
        i = j + 1 if j > i else i + 1
    return best


# ---------------------------------------------------------------- events
def detect_events(pts, ts, limit: int = 12) -> list[AnalyticsEvent]:
    """Inferred from CO2 / PM2.5 patterns. There is no occupancy or purifier sensor."""
    last: dict[str, datetime] = {}
    out: list[AnalyticsEvent] = []

    def fire(i: int, kind: str, label: str) -> None:
        prev = last.get(kind)
        if prev and (ts[i] - prev).total_seconds() < 30 * 60:
            return
        last[kind] = ts[i]
        out.append(AnalyticsEvent(t=pts[i]["t"], kind=kind, label=label))

    for i in range(len(pts)):
        j = _lookback(ts, i, 10)
        if j is None:
            continue
        d_co2 = pts[i]["co2"] - pts[j]["co2"]
        if d_co2 >= 150:
            fire(i, "occupancy", "Occupancy rise (CO₂ ↑)")
        elif d_co2 <= -200:
            fire(i, "ventilation", "Ventilation spike (CO₂ ↓)")
        p0, p1 = pts[j]["pm25"], pts[i]["pm25"]
        if p0 >= 12 and p1 <= 0.6 * p0:
            fire(i, "purifier", "Particulates clearing (PM2.5 ↓)")
    return out[-limit:]


# ---------------------------------------------------------------- ventilation + dose
def ventilation(pts, ts) -> Ventilation:
    base = {"outdoor_co2": OUTDOOR_CO2_PPM, "target": ACH_TARGET}
    seg = latest_decay(pts, ts, "co2", base=OUTDOOR_CO2_PPM)
    if seg is None:
        return Ventilation(status="unknown", **base)

    s, e = seg
    c0, c1 = pts[s]["co2"], pts[e]["co2"]
    hours = (ts[e] - ts[s]).total_seconds() / 3600
    ach = min(30.0, math.log((c0 - OUTDOOR_CO2_PPM) / (c1 - OUTDOOR_CO2_PPM)) / hours)
    return Ventilation(
        ach=round(ach, 1),
        status="optimal" if ach >= ACH_TARGET else "insufficient",
        measured_at=pts[e]["t"],
        duration_min=round(hours * 60, 1),
        co2_start=c0,
        co2_end=c1,
        **base,
    )


def dose(pts, ts, end: datetime) -> Dose:
    """CO2 above outdoor level, integrated over the last DOSE_SHIFT_HOURS (ppm·h)."""
    cutoff = end - timedelta(hours=DOSE_SHIFT_HOURS)
    total, count = 0.0, 0
    buckets: dict[datetime, list[float]] = defaultdict(list)
    for p, t in zip(pts, ts):
        if t < cutoff:
            continue
        excess = max(0.0, p["co2"] - OUTDOOR_CO2_PPM)
        total += excess / 60.0          # one point is one minute
        count += 1
        buckets[t.replace(minute=0, second=0, microsecond=0)].append(excess)

    budget = (CO2_LIMIT_PPM - OUTDOOR_CO2_PPM) * DOSE_SHIFT_HOURS
    return Dose(
        co2_ppm_h=round(total, 1),
        budget=budget,
        percent=round(total / budget * 100, 1),
        hours=round(count / 60, 1),
        series=[DoseBucket(hour=h.strftime("%H:00"), value=round(sum(v) / len(v), 1))
                for h, v in sorted(buckets.items())],
    )


# ---------------------------------------------------------------- insights (rule-based)
def insights(pts, ts, vent: Ventilation) -> list[Insight]:
    n = len(pts)
    if n < 10:
        return [Insight(level="tip", title="Collecting data",
                        text="Pattern analysis starts once about 10 minutes of readings are available.")]
    out: list[Insight] = []

    # 1. most recent risk spike and what moved before it
    for i in range(n - 1, 0, -1):
        if pts[i]["risk"] >= 40 and pts[i - 1]["risk"] < 40:
            j = _lookback(ts, i, 10)
            if j is not None:
                a, b = pts[j], pts[i]
                out.append(Insight(
                    level="warning",
                    title=f"Risk spike at {ts[i]:%H:%M}",
                    text=(f"Risk reached {b['risk']:.0f}%. In the 10 minutes before, CO₂ moved "
                          f"{a['co2']:.0f}→{b['co2']:.0f} ppm and PM2.5 {a['pm25']:.1f}→{b['pm25']:.1f} µg/m³."),
                ))
            break

    # 2. ventilation stagnation
    runs = _runs(pts, ts, lambda p: p["co2"] > CO2_LIMIT_PPM, min_minutes=15)
    if runs:
        s, e = runs[-1]
        dur = (ts[e] - ts[s]).total_seconds() / 60
        peak = max(p["co2"] for p in pts[s:e + 1])
        extra = f" Last measured clearance: {vent.ach} ACH." if vent.ach is not None else ""
        out.append(Insight(
            level="warning",
            title=f"Ventilation stagnation at {ts[s]:%H:%M}",
            text=f"CO₂ stayed above {CO2_LIMIT_PPM:.0f} ppm for {dur:.0f} min (peak {peak:.0f} ppm).{extra}",
        ))

    # 3. particulate clearance
    seg = latest_decay(pts, ts, "pm25", base=0.0, tol=0.8, min_minutes=5,
                       min_drop=5, floor_abs=1.0, floor_frac=0.03)
    if seg:
        s, e = seg
        a, b = pts[s]["pm25"], pts[e]["pm25"]
        eff = (a - b) / a * 100
        dur = (ts[e] - ts[s]).total_seconds() / 60
        good = eff >= 80
        out.append(Insight(
            level="success" if good else "warning",
            title=f"Particulates cleared {eff:.0f}% in {dur:.0f} min",
            text=(f"PM2.5 fell from {a:.1f} to {b:.1f} µg/m³ by {ts[e]:%H:%M}. "
                  + ("Clearance was quick." if good else "Clearance was slow: check filtration and air exchange.")),
        ))

    # 4. purge window before the hour with the highest average CO2
    by_hour: dict[int, list[float]] = defaultdict(list)
    for p, t in zip(pts, ts):
        by_hour[t.hour].append(p["co2"])
    if by_hour:
        h, vals = max(by_hour.items(), key=lambda kv: sum(kv[1]) / len(kv[1]))
        avg = sum(vals) / len(vals)
        if avg >= 800:
            out.append(Insight(
                level="tip",
                title=f"Suggested purge: {(h - 1) % 24:02d}:50 to {h:02d}:00",
                text=(f"CO₂ averages {avg:.0f} ppm around {h:02d}:00. Airing the room for about "
                      "10 minutes beforehand lowers the starting level."),
            ))

    if not out:
        out.append(Insight(level="success", title="No hazards detected",
                           text="CO₂ and particulates stayed within safe limits in this window."))
    return out[:5]


# ---------------------------------------------------------------- weekly heatmap
def weekly_heatmap(pts, ts, week_start: date) -> list[HeatCell]:
    cells: dict[tuple[int, int], dict] = {}
    for p, t in zip(pts, ts):
        if not (HEATMAP_FIRST_HOUR <= t.hour <= HEATMAP_LAST_HOUR):
            continue
        key = ((t.date() - week_start).days, t.hour)
        c = cells.setdefault(key, {"n": 0, "risk": 0.0, "peak": 0.0, "co2": 0.0, "pm25": 0.0})
        c["n"] += 1
        c["risk"] += p["risk"]
        c["peak"] = max(c["peak"], p["risk"])
        c["co2"] += p["co2"]
        c["pm25"] += p["pm25"]

    return [
        HeatCell(day=d, hour=h, risk=round(c["risk"] / c["n"], 1), peak=round(c["peak"], 1),
                 co2=round(c["co2"] / c["n"]), pm25=round(c["pm25"] / c["n"], 1), n=c["n"])
        for (d, h), c in sorted(cells.items())
    ]