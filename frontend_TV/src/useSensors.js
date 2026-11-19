import { useEffect, useRef, useState } from "react";
import { METRICS, REFRESH_MS, HISTORY, PRED, STALE_MS } from "./config";

const DB = import.meta.env.VITE_FIREBASE_DB_URL;
const PATH = import.meta.env.VITE_FIREBASE_PATH || "sensors/latest";
const PRED_PATH = import.meta.env.VITE_FIREBASE_PRED_PATH || "prediction/latest";
const AUTH = import.meta.env.VITE_FIREBASE_AUTH;
const LIST = import.meta.env.VITE_FIREBASE_LIST === "true";   // true if PATH is a list of push-key records (e.g. AirQualityData)
const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const DEMO = import.meta.env.VITE_DEMO === "true" || (!DB && !API);

// backend field -> TV key
const MAP = { aqi: "aqi", pm25: "pm2_5_ug_m3", pm10: "pm10_ug_m3", co2: "co2_ppm", voc: "voc_a_u", temp: "temperature_C", humidity: "humidity_pct", h2s: "h2s_so2_ppm", exposure: "exposure_hours" };
const HIST = { aqi: "aqi", pm25: "pm25", pm10: "pm10", co2: "co2", voc: "voc", temp: "temperature", humidity: "humidity", exposure: "exposure" };
// raw Firebase record aliases (same names your backend reads)
const ALIAS = { temp: ["temp", "temperature", "temperature_C"], h2s: ["h2s", "gas", "h2s_so2_ppm"], exposure: ["exposure", "exposure_hours"], pm25: ["pm25", "pm2_5", "pm2_5_ug_m3"], pm10: ["pm10", "pm10_ug_m3"], co2: ["co2", "co2_ppm"], voc: ["voc", "voc_a_u"], humidity: ["humidity", "humidity_pct"], aqi: ["aqi"] };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const base = { aqi: 90, pm25: 32, pm10: 48, co2: 1400, voc: 1, temp: 30, humidity: 45, h2s: 0.2, exposure: 1 };
const fake = (t) => Object.fromEntries(METRICS.map(({ key }, i) =>
  [key, Math.max(0, base[key] * (1 + 0.3 * Math.sin(t / 6 + i) + (Math.random() - 0.5) * 0.08))]));

const fbUrl = (p, q = "") => `${DB}/${p}.json?${[AUTH && `auth=${AUTH}`, q].filter(Boolean).join("&")}`;

async function fromBackend() {
  const r = await fetch(`${API}/api/live`, { cache: "no-store" });
  if (!r.ok) throw new Error(r.status);
  const j = await r.json();
  if (j.status !== "live" || !j.sensors) throw new Error("no data");
  const d = Object.fromEntries(Object.entries(MAP).map(([k, f]) => [k, j.sensors[f]]));
  const p = j.prediction;
  const pred = p ? { [PRED.probability]: p.risk_probability * 100, [PRED.level]: `${cap(p.risk_level)} Risk`, [PRED.condition]: p.disease_display } : null;
  const newAt = j.data_age_seconds != null ? Date.now() - j.data_age_seconds * 1000 : null;
  return { d, pred, newAt };
}

async function fromFirebase() {
  const r = await fetch(LIST ? fbUrl(PATH, 'orderBy="$key"&limitToLast=1') : fbUrl(PATH), { cache: "no-store" });
  if (!r.ok) throw new Error(r.status);
  let raw = await r.json();
  if (!raw) throw new Error("empty");
  if (LIST) raw = Object.values(raw).pop();
  const d = { ...raw };
  Object.entries(ALIAS).forEach(([k, names]) => { const n = names.find((x) => raw[x] != null); if (n) d[k] = raw[n]; });
  let pred = null;
  try { const r2 = await fetch(fbUrl(PRED_PATH), { cache: "no-store" }); if (r2.ok) pred = await r2.json(); } catch { /* optional */ }
  if (!pred && raw.infection_prob != null) { const x = Number(raw.infection_prob); pred = { [PRED.probability]: x <= 1 ? x * 100 : x }; }
  return { d, pred, newAt: null };
}

export function useSensors() {
  const [data, setData] = useState({});
  const [history, setHistory] = useState({});
  const [updated, setUpdated] = useState(null);
  const [online, setOnline] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [lastNew, setLastNew] = useState(null);   // when sensors LAST sent genuinely new data
  const [tried, setTried] = useState(false);
  const tick = useRef(0);
  const fp = useRef(null);
  const newAt = useRef(null);

  useEffect(() => {
    let stop = false;

    const seed = async () => {   // fill graphs with the last hour from the backend
      if (!API || DEMO) return;
      try {
        const j = await (await fetch(`${API}/api/history?minutes=60`, { cache: "no-store" })).json();
        const n = {};
        Object.entries(HIST).forEach(([key, f]) => { n[key] = j.points.map((p) => ({ t: Date.parse(p.timestamp), v: Number(p[f]) })).filter((p) => !Number.isNaN(p.v)); });
        if (!stop) setHistory(n);
      } catch { /* optional */ }
    };

    const pull = async () => {
      let got = null;
      if (DEMO) { const d = fake(tick.current++); got = { d, pred: { [PRED.probability]: Math.min(95, Math.max(0, (d.pm25 - 20) * 2.2)), [PRED.condition]: "Bronchitis or Irritation" }, newAt: Date.now() }; }
      else {
        // 1) backend first, 2) Firebase directly as fallback
        if (API) { try { got = await fromBackend(); } catch { /* try firebase */ } }
        if (!got && DB) { try { got = await fromFirebase(); } catch { /* offline */ } }
      }
      if (stop) return;
      setTried(true);
      if (!got) { setOnline(false); return; }          // unreachable: freeze last readings
      const { d, pred } = got;
      setOnline(true); setUpdated(new Date());
      // when did the sensors last send something NEW?
      const f = JSON.stringify(METRICS.map(({ key }) => d[key]));
      if (got.newAt != null) newAt.current = got.newAt;
      else if (f !== fp.current) newAt.current = Date.now();
      fp.current = f;
      if (newAt.current == null) newAt.current = Date.now();
      setLastNew(newAt.current);
      const fresh = Date.now() - newAt.current < STALE_MS;
      setData(d); setPrediction(pred);
      if (!fresh) return;                              // stale: keep graphs frozen
      setHistory((h) => {
        const n = { ...h };
        METRICS.forEach(({ key }) => {
          const v = Number(d[key]);
          if (d[key] != null && !Number.isNaN(v)) n[key] = [...(h[key] || []), { t: Date.now(), v }].slice(-HISTORY);
        });
        return n;
      });
    };

    seed().then(pull);
    const id = setInterval(pull, REFRESH_MS);
    return () => { stop = true; clearInterval(id); };
  }, []);

  return { data, history, updated, online, prediction, demo: DEMO, lastNew, tried };
}
