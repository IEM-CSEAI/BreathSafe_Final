import time
import pyrebase
from config import FIREBASE_CONFIG, FIREBASE_NODE, FIREBASE_EMAIL, FIREBASE_PASSWORD

_firebase = pyrebase.initialize_app(FIREBASE_CONFIG)
_db = _firebase.database()
_auth = _firebase.auth()

_user = None
_signed_in_at = 0.0
TOKEN_LIFETIME = 50 * 60   # Firebase ID tokens expire after 60 min


def _get_token():
    """Return a valid ID token, or None if no credentials are set."""
    global _user, _signed_in_at
    if not (FIREBASE_EMAIL and FIREBASE_PASSWORD):
        return None
    if _user is None:
        _user = _auth.sign_in_with_email_and_password(FIREBASE_EMAIL, FIREBASE_PASSWORD)
        _signed_in_at = time.time()
    elif time.time() - _signed_in_at > TOKEN_LIFETIME:
        _user = _auth.refresh(_user["refreshToken"])
        _signed_in_at = time.time()
    return _user["idToken"]


def get_latest_firebase_data() -> dict | None:
    global _user
    try:
        token = _get_token()
        snapshot = (_db.child(FIREBASE_NODE)
                       .order_by_key()
                       .limit_to_last(1)
                       .get(token)
                       .val())
        if not snapshot:
            return None
        key, raw = list(snapshot.items())[0]
    except Exception as e:
        print(f"Firebase fetch error: {e}")
        _user = None   # force a fresh sign-in on the next poll
        return None

    def get(*keys, default=0.0):
        for k in keys:
            v = raw.get(k)
            if v is not None:
                try:
                    return float(v)
                except (TypeError, ValueError):
                    pass
        return default

    return {
        "record_key":     str(key),
        "temperature_C":  get("temperature", "temperature_C"),
        "humidity_pct":   min(get("humidity", "humidity_pct"), 100.0),
        "pm2_5_ug_m3":    get("pm25", "pm2_5", "pm2_5_ug_m3"),
        "pm10_ug_m3":     get("pm10", "pm10_ug_m3"),
        "voc_a_u":        get("voc", "voc_a_u"),
        "co2_ppm":        get("co2", "co2_ppm"),
        "h2s_so2_ppm":    get("gas", "h2s_so2_ppm"),
        "exposure_hours": get("exposure_hours", default=2.0),
        "infection_prob": get("infection_prob", default=0.0),
        "aqi":            int(get("aqi", default=0)),
        "pressure":       get("pressure", default=0.0),
    }