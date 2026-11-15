const CX = 60;
const CY = 60;
const R = 50;
const ARC = `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const LEN = Math.PI * R;

// Marks where "moderate" (40%) and "high" (70%) begin
const TICKS = [40, 70];

// Point on the arc at fraction f (0..1) and radius r
function at(f, r) {
  const a = Math.PI * (1 - f);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

export default function Gauge({ value = 0, color = "muted", size = 160 }) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = `rgb(var(--${color}))`;

  return (
    <svg
      viewBox="0 -10 120 80"
      width={size}
      className="shrink-0"
      role="img"
      aria-label={`Risk ${Math.round(v)} percent`}
    >
      <defs>
        <linearGradient id="gauge-track" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="110" y2="0">
          <stop offset="0%" style={{ stopColor: "rgb(var(--gauge-from))" }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--gauge-to))" }} />
        </linearGradient>
      </defs>

      {/* track */}
      <path d={ARC} fill="none" stroke="url(#gauge-track)" strokeWidth="10" strokeLinecap="round" />

      {/* filled value */}
      {v > 0 && (
        <path
          d={ARC}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(LEN * v) / 100} ${LEN}`}
          style={{
            transition: "stroke-dasharray 0.6s ease",
            filter: `drop-shadow(0 0 4px rgb(var(--${color}) / 0.6))`,
          }}
        />
      )}

      {/* threshold ticks */}
      {TICKS.map((t) => {
        const f = t / 100;
        const [x1, y1] = at(f, 41);
        const [x2, y2] = at(f, 59);
        const [lx, ly] = at(f, 66);
        return (
          <g key={t}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgb(var(--muted))" strokeWidth="1.3" strokeLinecap="round"
            />
            <text
              x={lx} y={ly + 2.5}
              textAnchor="middle" fontSize="7"
              fill="rgb(var(--muted))" fontFamily="'JetBrains Mono', monospace"
            >
              {t}
            </text>
          </g>
        );
      })}

      <text
        x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="700"
        fill="rgb(var(--text))" fontFamily="'JetBrains Mono', monospace"
      >
        {Math.round(v)}%
      </text>
    </svg>
  );
}