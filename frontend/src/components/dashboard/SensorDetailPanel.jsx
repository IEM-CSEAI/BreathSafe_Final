import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { fetchHistory } from "../../api/client";
import { useData } from "../../context/DataContext";
import { useTheme } from "../../hooks/useTheme";
import { STATUS } from "../../utils/thresholds";
import AnimatedNumber from "../common/AnimatedNumber";

const RANGES = [5, 30, 60];

const TICK = {
  fill: "rgb(var(--muted))",
  fontSize: 10,
  fontFamily: "JetBrains Mono, monospace",
};

function Stat({ label, value, digits }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-mono text-xl font-bold tabular-nums">
        {value === null ? "–" : value.toFixed(digits)}
      </div>
    </div>
  );
}

export default function SensorDetailPanel({ sensor, onClose }) {
  const { live, lastUpdated } = useData();
  const { theme } = useTheme();
  const [minutes, setMinutes] = useState(30);
  const [points, setPoints] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(minutes)
      .then((h) => !cancelled && setPoints(h.points))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [minutes, lastUpdated]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const data = useMemo(
    () =>
      points.map((p) => ({
        time: new Date(p.timestamp).toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
        value: p[sensor.history],
      })),
    [points, sensor]
  );

  const vals = data.map((d) => d.value);
  const min = vals.length ? Math.min(...vals) : null;
  const max = vals.length ? Math.max(...vals) : null;
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  const current = live?.sensors ? Number(live.sensors[sensor.field]) : null;
  const status = sensor.status && live?.statuses ? live.statuses[sensor.status] : "normal";
  const s = STATUS[status] ?? STATUS.normal;

  // light: blue variations · dark: status color
  const stroke =
    theme === "light" && sensor.chart
      ? `rgb(var(--${sensor.chart}))`
      : `rgb(var(--${s.color}))`;
  const gradId = `grad-${sensor.id}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="animate-fade-in absolute inset-0 bg-black/50" onClick={onClose} />

      <aside className="animate-drawer-in relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto border-l border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Sensor detail
            </div>
            <div className="mt-1 font-display text-2xl font-bold">{sensor.label}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition hover:border-accent hover:text-accent"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`font-mono text-5xl font-bold tabular-nums ${s.text}`}>
            <AnimatedNumber value={current} digits={sensor.digits} />
          </span>
          <span className="text-sm text-muted">{sensor.unit}</span>
          <span className={`ml-auto flex items-center gap-1.5 text-xs font-bold tracking-wider ${s.badge}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted">{sensor.about}</p>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.12em]">
              Last {minutes} min
            </span>
            <div className="flex gap-1">
              {RANGES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMinutes(m)}
                  className={`rounded-md border px-2.5 py-1 text-xs transition ${
                    minutes === m
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-muted hover:text-fg"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 rounded-lg border border-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" style={{ stopColor: stroke, stopOpacity: 0.35 }} />
                    <stop offset="100%" style={{ stopColor: stroke, stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={TICK}
                  minTickGap={40}
                  stroke="rgb(var(--border))"
                />
                <YAxis
                  tick={TICK}
                  domain={["auto", "auto"]}
                  stroke="rgb(var(--border))"
                />
                <Tooltip
                  contentStyle={{
                    background: "rgb(var(--surface))",
                    border: "1px solid rgb(var(--border))",
                    borderRadius: 8,
                    fontFamily: "inherit",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "rgb(var(--muted))" }}
                  itemStyle={{ color: "rgb(var(--text))" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={sensor.label}
                  stroke={stroke}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Min" value={min} digits={sensor.digits} />
          <Stat label="Avg" value={avg} digits={sensor.digits} />
          <Stat label="Max" value={max} digits={sensor.digits} />
        </div>

        {sensor.ranges.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em]">
              What the levels mean
            </div>
            <ul className="space-y-1.5">
              {sensor.ranges.map(([key, text]) => {
                const r = STATUS[key];
                const active = key === status;
                return (
                  <li
                    key={key}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      active ? "border-accent bg-accent/10" : "border-border"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${r.dot}`} />
                    <span className={`w-20 text-xs font-bold tracking-wider ${r.badge}`}>
                      {r.label}
                    </span>
                    <span className="text-muted">{text}</span>
                    {active && <span className="ml-auto text-xs text-accent">current</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}