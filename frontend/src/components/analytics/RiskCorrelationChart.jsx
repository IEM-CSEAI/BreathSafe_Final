import { useMemo } from "react";
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import AnalyticsCard from "./AnalyticsCard";

const COLOR = {
  co2: "rgb(var(--danger))",
  pm: "rgb(var(--warn))",
  risk: "rgb(var(--chart-6))",
};

const EVENT = {
  occupancy:   { color: "rgb(var(--danger))", short: "Occupancy" },
  purifier:    { color: "rgb(var(--warn))",   short: "PM clearing" },
  ventilation: { color: "rgb(var(--ok))",     short: "Ventilation" },
};

const tick = (fill) => ({ fill, fontSize: 10, fontWeight: 600, fontFamily: "JetBrains Mono, monospace" });

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-bold text-muted">{new Date(p.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="font-mono font-bold text-fg">CO₂: {p.co2.toFixed(0)} ppm · PM2.5: {p.pm25.toFixed(1)} · Risk: {p.risk.toFixed(1)}%</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold text-muted">
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLOR.co2 }} />CO₂</span>
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLOR.pm }} />PM2.5</span>
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLOR.risk }} />Risk %</span>
    </div>
  );
}

export default function RiskCorrelationChart({ points = [], events = [], loading, error }) {
  const data = useMemo(() => points.map((p) => ({ ...p, ts: Date.parse(p.t) })), [points]);
  const first = data[0]?.ts;
  const last = data[data.length - 1]?.ts;
  const marks = useMemo(
    () =>
      events
        .map((e) => ({ ...e, ts: Date.parse(e.t) }))
        .filter((e) => first != null && e.ts >= first && e.ts <= last),
    [events, first, last]
  );

  const span = data.length > 1 ? last - first : 0;
  const fmt = (ts) => {
    const d = new Date(ts);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return span > 36 * 3600e3 ? `${d.toLocaleDateString([], { day: "numeric", month: "short" })} ${time}` : time;
  };

  let body;
  if (data.length < 2) {
    body = (
      <div className="flex flex-1 items-center justify-center text-xs font-semibold text-muted">
        {error ? "Could not load chart." : loading ? "Loading data…" : "Collecting telemetry…"}
      </div>
    );
  } else {
    body = (
      <div className="relative flex-1 min-h-0 w-full">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="an-pm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: COLOR.pm, stopOpacity: 0.35 }} />
                  <stop offset="100%" style={{ stopColor: COLOR.pm, stopOpacity: 0 }} />
                </linearGradient>
                <linearGradient id="an-risk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: COLOR.risk, stopOpacity: 0.35 }} />
                  <stop offset="100%" style={{ stopColor: COLOR.risk, stopOpacity: 0 }} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" opacity={0.5} />
              <XAxis dataKey="ts" type="number" scale="time" domain={["dataMin", "dataMax"]}
                     tickFormatter={fmt} tick={tick("rgb(var(--muted))")} stroke="rgb(var(--border))" minTickGap={45} />
              <YAxis yAxisId="co2" domain={[400, (max) => Math.max(1200, Math.ceil(max / 200) * 200)]}
                     tick={tick(COLOR.co2)} stroke="rgb(var(--border))" width={40} />
              <YAxis yAxisId="risk" orientation="right" domain={[0, 100]}
                     tickFormatter={(v) => `${v}%`} tick={tick(COLOR.risk)} stroke="rgb(var(--border))" width={36} />
              <YAxis yAxisId="pm" orientation="right" domain={[0, (max) => Math.max(40, Math.ceil(max / 10) * 10)]}
                     tick={tick(COLOR.pm)} stroke="rgb(var(--border))" width={32} />

              <Tooltip content={<Tip />} />

              <Area yAxisId="pm" dataKey="pm25" stroke={COLOR.pm} strokeWidth={2} fill="url(#an-pm)" type="monotone" isAnimationActive={false} dot={false} />
              <Area yAxisId="risk" dataKey="risk" stroke={COLOR.risk} strokeWidth={2} fill="url(#an-risk)" type="monotone" isAnimationActive={false} dot={false} />
              <Line yAxisId="co2" dataKey="co2" stroke={COLOR.co2} strokeWidth={2} type="monotone" isAnimationActive={false} dot={false} />

              {marks.map((e) => (
                <ReferenceLine
                  key={`${e.kind}-${e.ts}`}
                  yAxisId="co2"
                  x={e.ts}
                  stroke={EVENT[e.kind].color}
                  strokeDasharray="3 3"
                  label={{ value: EVENT[e.kind].short, position: "top", fill: EVENT[e.kind].color, fontSize: 10, fontWeight: 700 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <AnalyticsCard
      title="Risk & telemetry correlation"
      subtitle="Inferred from CO₂ / PM2.5 patterns"
      right={<Legend />}
    >
      {body}
    </AnalyticsCard>
  );
}