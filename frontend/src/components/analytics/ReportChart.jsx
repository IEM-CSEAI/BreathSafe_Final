import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis,
} from "recharts";

const W = 680;
const H = 250;

const C = {
  co2: "rgb(var(--danger))",
  pm: "rgb(var(--warn))",
  risk: "rgb(var(--chart-6))",
};

const EVENT = {
  occupancy:   { color: "rgb(var(--danger))", short: "Occupancy" },
  purifier:    { color: "rgb(var(--warn))",   short: "PM clearing" },
  ventilation: { color: "rgb(var(--ok))",     short: "Ventilation" },
};

const tick = (fill) => ({ fill, fontSize: 9, fontFamily: "JetBrains Mono, monospace" });

export default function ReportChart({ points = [], events = [] }) {
  if (points.length < 2) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        Not enough data in this period to draw a chart.
      </div>
    );
  }

  const data = points.map((p) => ({ ...p, ts: Date.parse(p.t) }));
  const first = data[0].ts;
  const last = data[data.length - 1].ts;
  const marks = events
    .map((e) => ({ ...e, ts: Date.parse(e.t) }))
    .filter((e) => e.ts >= first && e.ts <= last);

  const span = last - first;
  const fmt = (ts) => {
    const d = new Date(ts);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return span > 36 * 3600e3
      ? `${d.toLocaleDateString([], { day: "numeric", month: "short" })} ${time}`
      : time;
  };

  return (
    <ComposedChart width={W} height={H} data={data} margin={{ top: 18, right: 0, left: 0, bottom: 0 }}>
      <defs>
        {/* ids differ from the on-screen chart so the two never clash */}
        <linearGradient id="rp-pm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: C.pm, stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: C.pm, stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id="rp-risk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: C.risk, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: C.risk, stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" />
      <XAxis
        dataKey="ts"
        type="number"
        scale="time"
        domain={["dataMin", "dataMax"]}
        tickFormatter={fmt}
        tick={tick("rgb(var(--muted))")}
        stroke="rgb(var(--border))"
        minTickGap={48}
      />
      <YAxis
        yAxisId="co2"
        domain={[400, (max) => Math.max(1200, Math.ceil(max / 200) * 200)]}
        tick={tick(C.co2)}
        stroke="rgb(var(--border))"
        width={44}
      />
      <YAxis
        yAxisId="risk"
        orientation="right"
        domain={[0, 100]}
        tickFormatter={(v) => `${v}%`}
        tick={tick(C.risk)}
        stroke="rgb(var(--border))"
        width={38}
      />
      <YAxis
        yAxisId="pm"
        orientation="right"
        domain={[0, (max) => Math.max(40, Math.ceil(max / 10) * 10)]}
        tick={tick(C.pm)}
        stroke="rgb(var(--border))"
        width={34}
      />

      <Area yAxisId="pm" dataKey="pm25" stroke={C.pm} strokeWidth={1.5} fill="url(#rp-pm)"
            type="monotone" isAnimationActive={false} dot={false} />
      <Area yAxisId="risk" dataKey="risk" stroke={C.risk} strokeWidth={2} fill="url(#rp-risk)"
            type="monotone" isAnimationActive={false} dot={false} />
      <Line yAxisId="co2" dataKey="co2" stroke={C.co2} strokeWidth={2}
            type="monotone" isAnimationActive={false} dot={false} />

      {marks.map((e) => (
        <ReferenceLine
          key={`${e.kind}-${e.ts}`}
          yAxisId="co2"
          x={e.ts}
          stroke={EVENT[e.kind].color}
          strokeDasharray="4 3"
          label={{ value: EVENT[e.kind].short, position: "top", fill: EVENT[e.kind].color, fontSize: 9 }}
        />
      ))}
    </ComposedChart>
  );
}