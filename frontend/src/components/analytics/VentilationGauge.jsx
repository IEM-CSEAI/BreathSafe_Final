import AnalyticsCard from "./AnalyticsCard";
import Sparkline from "../charts/Sparkline";

const CX = 60, CY = 55, R = 44, MAX = 10;
const ARC = `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const LEN = Math.PI * R;
const at = (f, r) => {
  const a = Math.PI * (1 - f);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};

const STATUS = {
  optimal:      { color: "ok",    pill: "border-ok/50 bg-ok/15 text-ok" },
  insufficient: { color: "warn",  pill: "border-warn/50 bg-warn/15 text-warn" },
  unknown:      { color: "muted", pill: "border-border text-muted" },
};

function AchGauge({ value, target, color }) {
  const frac = value == null ? 0 : Math.min(value, MAX) / MAX;
  const f = target / MAX;
  const [x1, y1] = at(f, 36);
  const [x2, y2] = at(f, 52);
  const [lx, ly] = at(f, 60);

  return (
    <svg viewBox="0 0 120 70" className="mx-auto w-full max-w-[210px] shrink-0" role="img"
         aria-label={value == null ? "ACH unknown" : `${value} ACH`}>
      <path d={ARC} fill="none" stroke="rgb(var(--border))" strokeWidth="9" strokeLinecap="round" />
      {frac > 0 && (
        <path
          d={ARC}
          fill="none"
          stroke={`rgb(var(--${color}))`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${LEN * frac} ${LEN}`}
        />
      )}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(var(--fg))" strokeWidth="2" strokeLinecap="round" />
      <text x={lx} y={ly + 2} textAnchor="middle" fontSize="7" fontWeight="bold" fill="rgb(var(--muted))"
            fontFamily="'JetBrains Mono', monospace">{target}</text>
      <text x="60" y="47" textAnchor="middle" fontSize="18" fontWeight="800" fill="rgb(var(--fg))"
            fontFamily="'JetBrains Mono', monospace">
        {value == null ? "–" : value.toFixed(1)}
      </text>
      <text x="60" y="58" textAnchor="middle" fontSize="8" fontWeight="bold" fill="rgb(var(--muted))">ACH</text>
    </svg>
  );
}

export default function VentilationGauge({ ventilation, dose, loading }) {
  if (!ventilation || !dose) {
    return (
      <AnalyticsCard title="Ventilation efficiency & exposure">
        <div className="flex flex-1 items-center justify-center text-xs font-semibold text-muted">
          {loading ? "Loading metrics…" : "No data yet"}
        </div>
      </AnalyticsCard>
    );
  }

  const st = STATUS[ventilation.status];
  const label =
    ventilation.status === "optimal"
      ? `Optimal (≥ ${ventilation.target.toFixed(1)} ACH)`
      : ventilation.status === "insufficient"
      ? `Insufficient (< ${ventilation.target.toFixed(1)} ACH)`
      : "Awaiting ventilation decay";

  const barColor = dose.percent >= 100 ? "bg-danger" : dose.percent >= 50 ? "bg-warn" : "bg-ok";

  return (
    <AnalyticsCard
      title="Ventilation efficiency & exposure"
      subtitle={`Target ≥ ${ventilation.target.toFixed(1)} ACH · from CO₂ decay`}
    >
      <div className="grid flex-1 min-h-0 grid-cols-2 gap-3 items-center">
        {/* Left: ACH Gauge */}
        <div className="flex flex-col items-center justify-center text-center">
          <AchGauge value={ventilation.ach} target={ventilation.target} color={st.color} />
          <span className={`mt-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${st.pill}`}>
            {label}
          </span>
          <p className="mt-1 line-clamp-2 text-[10px] font-medium text-muted">
            {ventilation.ach != null
              ? `CO₂ ${ventilation.co2_start.toFixed(0)}→${ventilation.co2_end.toFixed(0)} ppm over ${ventilation.duration_min.toFixed(0)}m.`
              : "Calculates during 8m+ continuous CO₂ decay."}
          </p>
        </div>

        {/* Right: Dose Tracker */}
        <div className="flex flex-col justify-center border-l border-border/40 pl-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
            CO₂ Exposure · 8h Shift
          </div>
          <div className="font-mono text-2xl font-extrabold text-fg tabular-nums">
            {dose.co2_ppm_h.toFixed(1)}
            <span className="ml-1 text-xs font-semibold text-muted">ppm·h</span>
          </div>

          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(100, dose.percent)}%` }}
            />
          </div>
          <div className="mt-0.5 text-[10px] font-semibold text-muted">
            {dose.percent.toFixed(1)}% of shift budget
          </div>

          <div className="mt-1 h-8 w-full">
            <Sparkline values={dose.series.map((s) => s.value)} color="info" />
          </div>
        </div>
      </div>
    </AnalyticsCard>
  );
}