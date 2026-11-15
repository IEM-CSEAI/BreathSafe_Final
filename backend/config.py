import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths & environment setup
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")

MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

# Ensure data directory exists for local caching/aggregation
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Firebase RTDB configuration
FIREBASE_CONFIG = {
    "apiKey":        os.environ.get("FIREBASE_API_KEY"),
    "authDomain":    os.environ.get("FIREBASE_AUTH_DOMAIN"),
    "databaseURL":   os.environ.get("FIREBASE_DATABASE_URL"),
    "projectId":     os.environ.get("FIREBASE_PROJECT_ID"),
    "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET"),
}
FIREBASE_NODE = "AirQualityData"

# Firebase authentication credentials
FIREBASE_EMAIL = os.environ.get("FIREBASE_EMAIL")
FIREBASE_PASSWORD = os.environ.get("FIREBASE_PASSWORD")

# Polling & retention settings
POLL_SECONDS = 5
MAX_HISTORY = 720              # In-memory buffer: 1 hour at 5s intervals
MINUTE_RETENTION_DAYS = 30     # Persistent retention horizon

# Clinical risk & disease classification thresholds
RISK_HIGH = 0.70
RISK_MODERATE = 0.40
DISEASE_MIN_CONFIDENCE = 0.55

# Epidemiological analytics & ventilation standards
OUTDOOR_CO2_PPM = 420.0        # Atmospheric background CO2 baseline
ACH_TARGET = 5.0               # WHO/ASHRAE guideline for airborne pathogen mitigation
CO2_LIMIT_PPM = 1000.0         # Threshold for fresh air turnover adequacy
DOSE_SHIFT_HOURS = 8           # Standard shift duration for cumulative inhalation dose

# Weekly exposure heatmap bounds
HEATMAP_FIRST_HOUR = 8         # 8:00 AM start
HEATMAP_LAST_HOUR = 20         # 8:00 PM end (13 columns x 7 days = 91 total hourly cells)

STALE_AFTER_SECONDS = 120   # set to a few times your sensor's write interval

# Network & CORS
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]