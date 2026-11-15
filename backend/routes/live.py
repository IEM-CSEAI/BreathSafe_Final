import time
from datetime import datetime

from fastapi import APIRouter

from config import STALE_AFTER_SECONDS
from schemas import LiveResponse, SensorReading
from services import history as history_service
from services.firebase_service import get_latest_firebase_data
from services.inference import run_inference
from services.recommendations import classify, recommend

router = APIRouter()

state = {
    "latest": LiveResponse(status="no_data", timestamp=datetime.now().isoformat(timespec="seconds")),
    "firebase_ok": False,
    "fingerprint": None,    # what the last record looked like
    "changed_at": None,     # when that fingerprint last changed (epoch seconds)
}


def refresh() -> None:
    """Called by the background poller every POLL_SECONDS."""
    now = datetime.now().isoformat(timespec="seconds")
    try:
        data = get_latest_firebase_data()
        if data is None:
            state["firebase_ok"] = False
            state["latest"] = LiveResponse(status="no_data", timestamp=now)
            return

        # A new record key or any changed value means the sensors wrote something new.
        record_key = data.pop("record_key", None)
        fingerprint = (record_key, tuple(sorted(data.items())))
        if fingerprint != state["fingerprint"]:
            state["fingerprint"] = fingerprint
            state["changed_at"] = time.time()

        sensors = SensorReading(**data)
        prediction = run_inference(data)
        statuses = classify(sensors)

        history_service.push(sensors, prediction)
        state["firebase_ok"] = True
        state["latest"] = LiveResponse(
            status="live", timestamp=now, sensors=sensors, statuses=statuses,
            prediction=prediction, recommendations=recommend(statuses, prediction),
        )
    except Exception as e:
        print(f"Refresh error: {e}")
        state["firebase_ok"] = False


@router.get("/live", response_model=LiveResponse)
def get_live():
    latest = state["latest"]
    changed = state["changed_at"]
    if latest.status == "live" and changed is not None:
        age = time.time() - changed
        return latest.model_copy(update={
            "data_age_seconds": int(age),
            "stale": age > STALE_AFTER_SECONDS,
        })
    return latest