// ---- EDIT HERE ----------------------------------------------------------
// key  = field name in your Firebase JSON
// warn/high = thresholds (Elevated / High). `range` = healthy band (humidity).
// max  = right end of the scale bar.
export const METRICS = [
  { key: "aqi", color: "#2fd08a", icon: "leaf",      label: "Air Quality Index", short: "AQI",   sub: "Overall air quality",        unit: "",      dec: 0, warn: 50,   high: 150,  max: 300 },
  { key: "pm25", color: "#2f8cff", icon: "pm25",     label: "PM2.5",             short: "PM2.5", sub: "Fine particles",             unit: "µg/m³", dec: 1, warn: 25,   high: 55,   max: 100 },
  { key: "pm10", color: "#9b6bff", icon: "pm10",     label: "PM10",              short: "PM10",  sub: "Coarse dust",                unit: "µg/m³", dec: 1, warn: 50,   high: 150,  max: 250 },
  { key: "co2", color: "#ffa51f", icon: "cloud",      label: "Carbon Dioxide",    short: "CO₂",   sub: "Ventilation indicator",      unit: "ppm",   dec: 0, warn: 1000, high: 2000, max: 3000 },
  { key: "voc", color: "#19c37d", icon: "voc",      label: "VOC",               short: "VOC",   sub: "Volatile organic compounds", unit: "a.u.",  dec: 1, warn: 3,    high: 6,    max: 10 },
  { key: "temp", color: "#19c37d", icon: "temp",     label: "Temperature",       short: "TEMP",  sub: "Air temperature",            unit: "°C",    dec: 1, warn: 35,   high: 40,   max: 50 },
  { key: "humidity", color: "#2f8cff", icon: "drop", label: "Humidity",          short: "HUM",   sub: "Relative humidity",          unit: "%",     dec: 1, range: [30, 60], high: 80, max: 100 },
  { key: "h2s", color: "#19c37d", icon: "flask",      label: "Hydrogen Sulfide",  short: "H₂S",   sub: "Toxic gas",                  unit: "ppm",   dec: 2, warn: 1,    high: 10,   max: 15 },
  { key: "exposure", color: "#9b6bff", icon: "shield", kind: "bars", label: "Exposure",          short: "EXP",   sub: "Time in current air",        unit: "hrs",   dec: 1, warn: 8,    high: 12,   max: 16 },
];
export const REFRESH_MS = 5000;   // data refresh
export const SLIDE_MS = 8000;     // time per sensor slide
export const TREND_MS = 14000;    // time on the final trends + risk slide
export const STALE_MS = 60000;     // no NEW sensor data for this long -> freeze + show warning popup
export const HISTORY = 720;       // points kept for graphs (720 x 5s = 1 hour)

// Final slide: which sensors are drawn together (values shown as % of each sensor's scale)
export const TREND_KEYS = ["pm25", "pm10", "co2", "voc"];

// Prediction node in Firebase: field names + risk bands (probability in PERCENT, 0-100)
export const PRED = { probability: "probability", level: "level", condition: "condition", warn: 40, high: 70 };
// -------------------------------------------------------------------------

export function statusOf(m, v) {
  if (v == null || Number.isNaN(v)) return "none";
  if (m.range) return v >= m.high ? "high" : v < m.range[0] || v > m.range[1] ? "warn" : "ok";
  return v >= m.high ? "high" : v >= m.warn ? "warn" : "ok";
}
export const STATUS_TEXT = { ok: "Normal", warn: "Elevated", high: "High", none: "No data" };

export function zonesOf(m) {
  const z = m.range
    ? [[0, m.range[0], "warn"], [m.range[0], m.range[1], "ok"], [m.range[1], m.high, "warn"], [m.high, m.max, "high"]]
    : [[0, m.warn, "ok"], [m.warn, m.high, "warn"], [m.high, m.max, "high"]];
  return z.map(([a, b, s]) => ({ s, w: ((b - a) / m.max) * 100 }));
}
