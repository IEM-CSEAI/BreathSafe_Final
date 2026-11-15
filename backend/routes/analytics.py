from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query

from config import HEATMAP_FIRST_HOUR, HEATMAP_LAST_HOUR, MINUTE_RETENTION_DAYS
from schemas import AnalyticsPoint, AnalyticsResponse, HeatmapResponse
from services import analytics as an
from services import history as history_service

router = APIRouter()

PRESET_HOURS = {"24h": 24, "7d": 24 * 7, "30d": 24 * 30}


def _window(preset: str | None, start: str | None, end: str | None) -> tuple[datetime, datetime]:
    now = datetime.now()
    floor = now - timedelta(days=MINUTE_RETENTION_DAYS)

    # custom range: both dates given
    if start and end:
        try:
            s = datetime.fromisoformat(start).replace(tzinfo=None)
            e = datetime.fromisoformat(end).replace(tzinfo=None)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start or end")
        s, e = max(s, floor), min(e, now)
        if e - s < timedelta(minutes=1):
            raise HTTPException(status_code=400, detail="Range must be at least 1 minute")
        return s, e

    # preset range (default 24h)
    key = preset or "24h"
    hours = PRESET_HOURS.get(key)
    if hours is None:
        raise HTTPException(status_code=400, detail="Unknown range")
    return now - timedelta(hours=hours), now


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    preset: str | None = Query(None, alias="range"),
    start: str | None = None,
    end: str | None = None,
):
    s, e = _window(preset, start, end)
    pts = history_service.minute_points(s, e)
    print(f"[analytics] range={preset} start={start} end={end} -> window {s} to {e}, {len(pts)} minutes")

    ts = [datetime.fromisoformat(p["t"]) for p in pts]
    vent = an.ventilation(pts, ts)

    return AnalyticsResponse(
        start=s.isoformat(timespec="seconds"),
        end=e.isoformat(timespec="seconds"),
        count=len(pts),
        points=[AnalyticsPoint(**p) for p in an.downsample(pts)],
        events=an.detect_events(pts, ts) if (e - s) <= timedelta(hours=48) else [],
        ventilation=vent,
        dose=an.dose(pts, ts, e),
        insights=an.insights(pts, ts, vent),
    )


@router.get("/analytics/heatmap", response_model=HeatmapResponse)
def get_heatmap():
    now = datetime.now()
    week_start = (now - timedelta(days=now.weekday())).date()
    start = datetime.combine(week_start, datetime.min.time())
    pts = history_service.minute_points(start, start + timedelta(days=7))
    ts = [datetime.fromisoformat(p["t"]) for p in pts]

    return HeatmapResponse(
        week_start=week_start.isoformat(),
        now=now.isoformat(timespec="seconds"),
        first_hour=HEATMAP_FIRST_HOUR,
        last_hour=HEATMAP_LAST_HOUR,
        cells=an.weekly_heatmap(pts, ts, week_start),
    )


# TEMPORARY diagnostic: is the backend recording minutes at all? Delete once Analytics works.
@router.get("/analytics/status")
def analytics_status():
    with history_service._lock:
        stored = len(history_service._minutes)
        building = history_service._current is not None and history_service._current["n"] > 0
    return {
        "stored_minutes": stored,
        "current_minute_building": building,
        "server_time": datetime.now().isoformat(timespec="seconds"),
    }