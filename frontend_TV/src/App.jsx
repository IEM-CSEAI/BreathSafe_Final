import { useEffect, useState } from "react";
import { METRICS, STALE_MS, SLIDE_MS, TREND_MS, TREND_KEYS, PRED, statusOf, STATUS_TEXT, zonesOf } from "./config";
import { useSensors } from "./useSensors";
import Icon from "./icons.jsx";

const fmt = (v, d) => (v == null || Number.isNaN(Number(v)) ? "--" : Number(v).toFixed(d));
const pad = (n) => String(n).padStart(2, "0");
const clock = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// smooth bezier through [x,y] points (percent coords)
function smooth(p) {
  if (p.length < 2) return "";
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    d += ` C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`;
  }
  return d;
}
const toXY = (pts, yOf) => {
  const t0 = pts[0].t, span = pts[pts.length - 1].t - t0 || 1;
  return pts.map((p) => [((p.t - t0) / span) * 100, yOf(p.v)]);
};

function Frame({ ylabs, t0, t1, children }) {
  return (
    <div className="frame">
      <div className="plot">
        {ylabs.map((l, i) => <div key={i} className="grid" style={{ top: `${(i / (ylabs.length - 1)) * 100}%` }}><span>{l}</span></div>)}
        {children}
      </div>
      <div className="xl"><span>{clock(t0)}</span><span>{clock((t0 + t1) / 2)}</span><span>{clock(t1)}</span></div>
    </div>
  );
}

function Curve({ d, color, id, fill = true, w = 3.500 }) {
  return (
    <>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".38" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {fill && <path d={`${d} L100,100 L0,100 Z`} fill={`url(#${id})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </>
  );
}

function Graph({ pts, m }) {
  if (pts.length < 2) return <div className="empty">Collecting live data…</div>;
  const vals = pts.map((p) => p.v);
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
  if (m.kind === "bars") {
    const n = Math.min(24, pts.length), size = pts.length / n;
    const bars = Array.from({ length: n }, (_, i) => { const sl = vals.slice(Math.floor(i * size), Math.floor((i + 1) * size) || undefined); return sl.reduce((a, b) => a + b, 0) / (sl.length || 1); });
    const hi = Math.max(...bars) * 1.15 || 1;
    return (
      <Frame t0={t0} t1={t1} ylabs={[0, 1, 2, 3, 4].map((i) => fmt(hi * (1 - i / 4), 1))}>
        <div className="bars">{bars.map((b, i) => <i key={i} style={{ height: `${(b / hi) * 100}%` }} />)}</div>
      </Frame>
    );
  }
  const lo0 = Math.min(...vals), hi0 = Math.max(...vals), pd = (hi0 - lo0) * 0.3 || Math.abs(hi0) * 0.1 || 1;
  const lo = lo0 - pd, hi = hi0 + pd;
  const y = (v) => 100 - ((v - lo) / (hi - lo)) * 100;
  const xy = toXY(pts, y), last = xy[xy.length - 1];
  const marks = [m.warn && ["Elevated", m.warn], m.high && ["High", m.high]].filter((x) => x && x[1] > lo && x[1] < hi);
  return (
    <Frame t0={t0} t1={t1} ylabs={[0, 1, 2, 3, 4].map((i) => fmt(hi - ((hi - lo) * i) / 4, m.dec))}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"><Curve d={smooth(xy)} color={m.color} id="gm" /></svg>
      {marks.map(([t, v]) => <div key={t} className="mark" style={{ top: `${y(v)}%` }}><span>{t} · {v}</span></div>)}
      <i className="pt" style={{ left: `${last[0]}%`, top: `${last[1]}%` }} />
    </Frame>
  );
}

function Scale({ m, value }) {
  const pos = Math.min(100, Math.max(0, (Number(value) / m.max) * 100));
  return (
    <div className="scale">
      <div className="bar">{zonesOf(m).map((z, i) => <b key={i} className={`z-${z.s}`} style={{ width: `${z.w}%` }} />)}{value != null && <i style={{ left: `${pos}%` }} />}</div>
      <div className="ends"><span>0</span><span>{m.max}{m.unit && ` ${m.unit}`}</span></div>
    </div>
  );
}

function Trends({ history, data }) {
  const ms = TREND_KEYS.map((k) => METRICS.find((m) => m.key === k)).filter((m) => history[m.key]?.length > 1);
  const all = ms.flatMap((m) => history[m.key]);
  const t0 = Math.min(...all.map((p) => p.t)), t1 = Math.max(...all.map((p) => p.t));
  return (
    <div className="trendcard">
      <div className="legend">
        {TREND_KEYS.map((k) => { const m = METRICS.find((x) => x.key === k); return <span key={k} style={{ "--sc": m.color }}><i />{m.short}<b>{fmt(data[k], m.dec)}</b></span>; })}
      </div>
      {ms.length ? (
        <Frame t0={t0} t1={t1} ylabs={["100", "75", "50", "25", "0"]}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {ms.map((m) => { const pts = history[m.key]; const xy = pts.map((p) => [((p.t - t0) / (t1 - t0 || 1)) * 100, 100 - Math.min(100, (p.v / m.max) * 100)]); return <Curve key={m.key} d={smooth(xy)} color={m.color} id={`t-${m.key}`} />; })}
          </svg>
        </Frame>) : <div className="empty">Collecting live data…</div>}
      <p className="note">Each line shown as % of its sensor's scale</p>
    </div>
  );
}

function Risk({ prediction }) {
  const raw = prediction ? Number(prediction[PRED.probability]) : NaN;
  const ok = !Number.isNaN(raw), p = ok ? Math.min(100, Math.max(0, raw)) : 0;
  const lvl = !ok ? "none" : p >= PRED.high ? "high" : p >= PRED.warn ? "warn" : "ok";
  const label = prediction?.[PRED.level] || { ok: "Low Risk", warn: "Moderate Risk", high: "High Risk", none: "No data" }[lvl];
  const a = Math.PI * (1 - p / 100), mx = 100 + 80 * Math.cos(a), my = 100 - 80 * Math.sin(a);
  return (
    <div className={`risk s-${lvl}`}>
      <div className="gauge">
        <svg viewBox="0 0 200 112">
          <defs><linearGradient id="rg" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="180" y2="0"><stop offset="0" stopColor="var(--ok)" /><stop offset=".5" stopColor="var(--warn)" /><stop offset="1" stopColor="var(--high)" /></linearGradient></defs>
          <path d="M20 100A80 80 0 0 1 180 100" pathLength="100" className="gt" />
          {ok && <path d="M20 100A80 80 0 0 1 180 100" pathLength="100" stroke="url(#rg)" strokeDasharray={`${p} 100`} className="gf" />}
          {ok && <circle cx={mx} cy={my} r="7" className="gm" />}
        </svg>
        <div className="gc"><b className="mono">{ok ? `${p.toFixed(1)}%` : "--"}</b><span>{label}</span></div>
      </div>
      <div className="cond">
        <small>Most likely if exposure continues</small>
        <h3>{lvl === "ok" || lvl === "none" ? (lvl === "ok" ? "No concern right now" : "Waiting for prediction") : prediction?.[PRED.condition] || "—"}</h3>
        <em>Reference only · not a medical diagnosis</em>
      </div>
    </div>
  );
}

export default function App() {
  const { data, history, updated, online, prediction, demo, lastNew, tried } = useSensors();
  const [theme, setTheme] = useState(() => localStorage.getItem("bs-tv-theme") || "dark");
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(new Date());
  const N = METRICS.length + 1, isTrend = idx === METRICS.length, ms = isTrend ? TREND_MS : SLIDE_MS;

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("bs-tv-theme", theme); }, [theme]);
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { if (paused) return; const t = setTimeout(() => setIdx((i) => (i + 1) % N), ms); return () => clearTimeout(t); }, [idx, paused, ms, N]);
  useEffect(() => {
    const k = (e) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % N);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + N) % N);
      if ([" ", "p", "P"].includes(e.key)) setPaused((p) => !p);
      if (["t", "T", "Enter"].includes(e.key)) setTheme((t) => (t === "dark" ? "light" : "dark"));
      if (["f", "F"].includes(e.key)) document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [N]);

  const m = METRICS[idx] || METRICS[0];
  const v = data[m.key];
  const rp = prediction ? Number(prediction[PRED.probability]) : NaN;
  const s = isTrend ? (Number.isNaN(rp) ? "none" : rp >= PRED.high ? "high" : rp >= PRED.warn ? "warn" : "ok") : statusOf(m, Number(v));
  const pts = history[m.key] || [];
  const vals = pts.map((p) => p.v);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const age = lastNew ? Math.max(0, Math.round((now - lastNew) / 1000)) : null;
  const stale = age != null && age * 1000 >= STALE_MS;
  const noData = !online && tried && !demo;
  const live = online && !stale && !noData;
  const fmtAge = (sec) => { const m = Math.floor(sec / 60); return m < 60 ? `${m} MIN` : `${Math.floor(m / 60)} H ${pad(m % 60)} MIN`; };
  const mins = pts.length > 1 ? Math.max(1, Math.round((pts[pts.length - 1].t - pts[0].t) / 60000)) : 0;

  return (
    <div className={`screen s-${s}${stale || noData ? " frozen" : ""}`}>
      <header>
        <div className="navbar">
          <div className="nlogo"><img src="/iem-logo.jpg" alt="IEM" /></div>
          <div className="ncenter">
            <b>Institute of Engineering and Management</b>
            <span>(School of University of Engineering and Management), Kolkata</span>
          </div>
          <div className="nlogo"><img src="/uem-logo.jpg" alt="UEM" /></div>
        </div>
        <div className="toolbar">
          <div className="tl">
            <div className="mark-logo">BreathSafe<b>.</b></div>
            <span className="vsep" />
            <span className="eyebrow">◆ AIRBORNE DISEASE DETECTION SYSTEM</span>
            <div className="tags"><span className="badge g">CSE (AI &amp; ML)</span><span className="badge g">CSE (AI)</span><span className="badge b">IEDC</span></div>
          </div>
          <div className="hr">
            <span className="meta">FIREBASE RTDB · 5s</span>
            <span className={`live ${live ? "on" : ""}`}><i />{live ? "Live" : stale || noData ? "No signal" : "Connecting…"}{demo && " · demo"}</span>
            <div className="dt"><b className="mono">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</b>
              <span>{now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span></div>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{theme === "dark" ? "☀" : "☾"}</button>
          </div>
        </div>
      </header>

      {(!online && tried && !demo) || stale ? (
        <div className={`alert ${!online ? "red" : "amber"}`} role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.8M13.9 10.2a10 10 0 0 1 5.1 2.7M12 20h.01" /></svg>
          <span>
            {!online
              ? <><b>CONNECTION LOST</b> — backend not responding.{lastNew ? ` Showing last readings (no new data for ${fmtAge(age)}).` : ""} Retrying automatically…</>
              : <><b>NO NEW SENSOR DATA FOR {fmtAge(age)}</b> — showing the last readings. Check that the sensors are powered and connected. Live data will resume automatically.</>}
          </span>
        </div>
      ) : null}

      {isTrend ? (
        <main key="trend" className="tmain">
          <section className="tleft">
            <div className="idx">{pad(N)} <span>/ {pad(N)}</span></div>
            <h1 className="hrow"><span className="ib" style={{ "--sc": "var(--ink)" }}><Icon name="chart" /></span>Sensor Trends<small>{mins ? `Last ${mins} min` : ""}</small></h1>
            <Trends history={history} data={data} />
          </section>
          <section className="tright">
            <h1 className="hrow"><span className="ib" style={{ "--sc": "var(--c)" }}><Icon name="activity" /></span>Infection Risk</h1>
            <Risk prediction={prediction} />
          </section>
        </main>
      ) : (
        <main key={m.key} style={{ "--sc": m.color }}>
          <section className="left">
            <div className="idx">{pad(idx + 1)} <span>/ {pad(N)}</span></div>
            <h1 className="hrow"><span className="ib"><Icon name={m.icon} /></span>{m.label}</h1>
            <p className="sub">{m.sub}</p>
            <div className="num">{fmt(v, m.dec)}<small>{m.unit}</small></div>
            <div className="status"><i />{STATUS_TEXT[s]}</div>
            <Scale m={m} value={v == null ? null : Number(v)} />
          </section>
          <section className="right">
            <div className="gh">Live trend{mins ? ` · last ${mins} min` : ""}</div>
            <Graph pts={pts} m={m} />
            <div className="stats">
              {[["Min", vals.length ? Math.min(...vals) : null], ["Average", avg], ["Max", vals.length ? Math.max(...vals) : null]].map(([t, x]) => <div key={t}><span>{t}</span><b>{fmt(x, m.dec)}</b></div>)}
            </div>
          </section>
        </main>
      )}

      <nav style={{ gridTemplateColumns: `repeat(${N},1fr)` }}>
        {[...METRICS.map((x) => ({ short: x.short, st: statusOf(x, Number(data[x.key])) })), { short: "TRENDS", st: "none" }].map((x, i) => (
          <div key={x.short} className={`seg st-${x.st} ${i === idx ? "on" : ""}`}>
            <span><i />{x.short}</span>
            <em>{i === idx && <u key={idx} className={paused ? "pause" : ""} style={{ animationDuration: `${ms}ms` }} />}</em>
          </div>))}
      </nav>
    </div>
  );
}