from typing import Literal, Optional
from pydantic import BaseModel

Status = Literal["normal", "low", "moderate", "high"]
RiskLevel = Literal["low", "moderate", "high"]


class SensorReading(BaseModel):
    temperature_C: float
    humidity_pct: float
    pm2_5_ug_m3: float
    pm10_ug_m3: float
    voc_a_u: float
    co2_ppm: float
    h2s_so2_ppm: float
    exposure_hours: float
    infection_prob: float
    aqi: int
    pressure: float = 0.0


class SensorStatuses(BaseModel):
    temperature: Status
    humidity: Status
    pm25: Status
    pm10: Status
    co2: Status
    voc: Status
    aqi: Status

class Driver(BaseModel):
    feature: str
    label: str
    z: float          # standard deviations from the training average

class Prediction(BaseModel):
    risk_label: int
    risk_probability: float
    risk_level: RiskLevel
    disease_name: str
    disease_display: str
    disease_confidence: float
    drivers: list[Driver] = []


class LiveResponse(BaseModel):
    status: Literal["live", "no_data"]
    timestamp: str
    sensors: Optional[SensorReading] = None
    statuses: Optional[SensorStatuses] = None
    prediction: Optional[Prediction] = None
    recommendations: list[str] = []
    data_age_seconds: Optional[int] = None
    stale: bool = False


class HistoryPoint(BaseModel):
    timestamp: str
    temperature: float
    humidity: float
    pm25: float
    pm10: float
    co2: float
    voc: float
    aqi: int
    exposure: float
    risk_prob: float
    disease: str


class HistoryResponse(BaseModel):
    count: int
    points: list[HistoryPoint]


class HealthResponse(BaseModel):
    api: Literal["ok"]
    models_loaded: bool
    firebase: Literal["ok", "error"]

class AnalyticsPoint(BaseModel):
    t: str
    co2: float
    pm25: float
    risk: float            # percent, 0-100
    disease: str


class AnalyticsEvent(BaseModel):
    t: str
    kind: Literal["occupancy", "purifier", "ventilation"]
    label: str


class Ventilation(BaseModel):
    ach: Optional[float] = None
    status: Literal["optimal", "insufficient", "unknown"]
    measured_at: Optional[str] = None
    duration_min: Optional[float] = None
    co2_start: Optional[float] = None
    co2_end: Optional[float] = None
    outdoor_co2: float
    target: float


class DoseBucket(BaseModel):
    hour: str
    value: float


class Dose(BaseModel):
    co2_ppm_h: float
    budget: float
    percent: float
    hours: float           # hours of data actually covered
    series: list[DoseBucket]


class Insight(BaseModel):
    level: Literal["warning", "success", "tip"]
    title: str
    text: str


class AnalyticsResponse(BaseModel):
    start: str
    end: str
    count: int
    points: list[AnalyticsPoint]
    events: list[AnalyticsEvent]
    ventilation: Ventilation
    dose: Dose
    insights: list[Insight]


class HeatCell(BaseModel):
    day: int               # 0 = Monday
    hour: int
    risk: float
    peak: float
    co2: float
    pm25: float
    n: int


class HeatmapResponse(BaseModel):
    week_start: str
    now: str
    first_hour: int
    last_hour: int
    cells: list[HeatCell]