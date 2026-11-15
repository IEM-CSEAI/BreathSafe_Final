import joblib
import numpy as np
import pandas as pd

from config import MODELS_DIR, RISK_HIGH, RISK_MODERATE, DISEASE_MIN_CONFIDENCE
from schemas import Driver, Prediction
from services.feature_engineering import feature_engineering

risk_model = joblib.load(MODELS_DIR / "risk_model.pkl")
disease_model = joblib.load(MODELS_DIR / "disease_model.pkl")
_pre = joblib.load(MODELS_DIR / "preprocessors.pkl")

scaler = _pre["scaler"]
label_encoder = _pre["label_encoder"]
ALL_FEATURES = _pre["feature_names"]

BASE_FEATURES = [
    "temperature_C", "humidity_pct", "pm2_5_ug_m3", "pm10_ug_m3",
    "voc_a_u", "co2_ppm", "h2s_so2_ppm", "exposure_hours",
    "infection_prob", "aqi",
]

FEATURE_LABELS = {
    "temperature_C": "Temperature",
    "humidity_pct": "Humidity",
    "pm2_5_ug_m3": "PM2.5",
    "pm10_ug_m3": "PM10",
    "voc_a_u": "VOC",
    "co2_ppm": "CO₂",
    "h2s_so2_ppm": "H₂S/SO₂",
    "exposure_hours": "Exposure",
    "infection_prob": "Infection prob.",
    "aqi": "AQI",
    "pollutant_load": "Pollutant load",
    "co2_humidity_ratio": "CO₂/humidity ratio",
    "pm_ratio": "PM2.5/PM10 ratio",
    "aqi_exposure_index": "AQI × exposure",
    "voc_co2_combined": "VOC + CO₂ index",
    "thermal_comfort_index": "Thermal comfort",
}

# Model feature importances (falls back to equal weights if the model has none)
_imp = getattr(risk_model, "feature_importances_", None)
if _imp is not None and len(_imp) == len(ALL_FEATURES):
    IMPORTANCE = np.asarray(_imp, dtype=float)
else:
    IMPORTANCE = np.ones(len(ALL_FEATURES)) / len(ALL_FEATURES)

print("Models loaded")
print("  Features:", len(ALL_FEATURES))
print("  Disease classes:", _pre["disease_classes"])


def _drivers(x_row: np.ndarray, top_n: int = 3) -> list[Driver]:
    """Features with the biggest (importance x deviation from average)."""
    scores = IMPORTANCE * np.abs(x_row)
    order = np.argsort(scores)[::-1][:top_n]
    out = []
    for i in order:
        if abs(x_row[i]) < 0.5:        # close to average, not noteworthy
            continue
        name = ALL_FEATURES[i]
        out.append(Driver(
            feature=name,
            label=FEATURE_LABELS.get(name, name),
            z=round(float(x_row[i]), 2),
        ))
    return out


def run_inference(data: dict) -> Prediction:
    df = pd.DataFrame([{k: data[k] for k in BASE_FEATURES}])
    df = feature_engineering(df)
    X = scaler.transform(df[ALL_FEATURES])

    risk_label = int(risk_model.predict(X)[0])
    risk_prob = float(risk_model.predict_proba(X)[0][1])
    disease_enc = int(disease_model.predict(X)[0])
    disease_conf = float(disease_model.predict_proba(X)[0][disease_enc])
    disease_name = str(label_encoder.inverse_transform([disease_enc])[0])

    if risk_prob >= RISK_HIGH:
        level = "high"
    elif risk_prob >= RISK_MODERATE:
        level = "moderate"
    else:
        level = "low"

    display = (disease_name.replace("_", " ").title()
               if disease_conf >= DISEASE_MIN_CONFIDENCE else "Mixed / Uncertain")

    return Prediction(
        risk_label=risk_label,
        risk_probability=risk_prob,
        risk_level=level,
        disease_name=disease_name,
        disease_display=display,
        disease_confidence=disease_conf,
        drivers=_drivers(np.asarray(X)[0]),
    )


def models_loaded() -> bool:
    return all(m is not None for m in (risk_model, disease_model, scaler))