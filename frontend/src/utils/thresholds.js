// Full class names are written out so Tailwind can detect them.

export const STATUS = {
  normal:   { label: "NORMAL",   color: "ok",     dot: "bg-ok",     text: "text-fg",     badge: "text-ok",     pill: "border-ok/30 bg-ok/10 text-ok" },
  low:      { label: "LOW",      color: "info",   dot: "bg-info",   text: "text-info",   badge: "text-info",   pill: "border-info/30 bg-info/10 text-info" },
  moderate: { label: "ELEVATED", color: "warn",   dot: "bg-warn",   text: "text-warn",   badge: "text-warn",   pill: "border-warn/30 bg-warn/10 text-warn" },
  high:     { label: "HIGH",     color: "danger", dot: "bg-danger", text: "text-danger", badge: "text-danger", pill: "border-danger/30 bg-danger/10 text-danger" },
};

// risk level -> theme color variable
export const LEVEL_VAR = { high: "danger", moderate: "warn", low: "ok", none: "muted" };

export const CONNECTION = {
  live:       { label: "LIVE",            dot: "bg-ok animate-blink" },
  connecting: { label: "CONNECTING",      dot: "bg-warn" },
  waiting:    { label: "AWAITING SIGNAL", dot: "bg-warn" },
  stale:      { label: "STALE DATA",      dot: "bg-warn" },
  paused:     { label: "PAUSED",          dot: "bg-muted" },
  offline:    { label: "OFFLINE",         dot: "bg-danger" },
};

// field = key in /api/live sensors, history = key in /api/history points,
// status = key in /api/live statuses (null = no status for this sensor)
export const SENSORS = [
  { id: "pm25", label: "PM2.5", unit: "µg/m³", field: "pm2_5_ug_m3", history: "pm25", status: "pm25", digits: 1,
    about: "Fine particles under 2.5 µm that reach deep into the lungs. A key driver of respiratory infection risk.",
    ranges: [["normal", "≤ 12 µg/m³"], ["moderate", "12 – 35 µg/m³"], ["high", "> 35 µg/m³"]] },
  { id: "pm10", label: "PM10", unit: "µg/m³", field: "pm10_ug_m3", history: "pm10", status: "pm10", digits: 1,
    about: "Coarse particles such as dust and pollen that irritate the nose, throat, and upper airways.",
    ranges: [["normal", "≤ 54 µg/m³"], ["moderate", "55 – 154 µg/m³"], ["high", "> 154 µg/m³"]] },
  { id: "co2", label: "CO₂", unit: "ppm", field: "co2_ppm", history: "co2", status: "co2", digits: 0,
    about: "Carbon dioxide. A proxy for ventilation: high levels mean stale air where airborne pathogens linger.",
    ranges: [["normal", "≤ 600 ppm"], ["moderate", "601 – 1000 ppm"], ["high", "> 1000 ppm"]] },
  { id: "voc", label: "VOC", unit: "a.u.", field: "voc_a_u", history: "voc", status: "voc", digits: 1,
    about: "Volatile organic compounds from cleaning products, paint, and furniture. They can irritate airways.",
    ranges: [["normal", "≤ 100 a.u."], ["moderate", "101 – 250 a.u."], ["high", "> 250 a.u."]] },
  { id: "temp", label: "Temperature", unit: "°C", field: "temperature_C", history: "temperature", status: "temperature", digits: 1,
    about: "Room temperature. Extremes affect comfort and how long airborne pathogens survive.",
    ranges: [["low", "< 15 °C"], ["normal", "15 – 35 °C"], ["high", "> 35 °C"]] },
  { id: "hum", label: "Humidity", unit: "%", field: "humidity_pct", history: "humidity", status: "humidity", digits: 1,
    about: "Relative humidity. Too dry irritates airways, too humid encourages mold and pathogen growth.",
    ranges: [["low", "< 30 %"], ["normal", "30 – 70 %"], ["high", "> 70 %"]] },
  { id: "aqi", label: "AQI", unit: "", field: "aqi", history: "aqi", status: "aqi", digits: 0,
    about: "Air Quality Index, a combined score of overall outdoor-style air pollution.",
    ranges: [["normal", "≤ 50"], ["moderate", "51 – 100"], ["high", "> 100"]] },
  { id: "exp", label: "Exposure", unit: "hrs", field: "exposure_hours", history: "exposure", status: null, digits: 1,
    about: "Hours of exposure used by the model. It feeds the AQI × exposure feature and has no alert threshold.",
    ranges: [] },
];

SENSORS.forEach((s, i) => { s.chart = `chart-${i + 1}`; });