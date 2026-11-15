import Gauge from "../common/Gauge";
import AnimatedNumber from "../common/AnimatedNumber";
import { LEVEL_VAR } from "../../utils/thresholds";

const LABELS = { high: "High Risk", moderate: "Moderate Risk", low: "Low Risk", none: "–" };

export default function RiskCard({ prediction }) {
  const level = prediction?.risk_level ?? "none";
  const color = LEVEL_VAR[level];
  const pct = prediction ? prediction.risk_probability * 100 : 0;

  return (
    <div
      className="tint-card flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] bg-surface p-4"
      style={{
        borderColor: `rgb(var(--${color}))`,
        boxShadow: `0 0 18px rgb(var(--${color}) / 0.3)`,
        "--tint": `var(--${color})`,
      }}
    >
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
          Infection Risk Assessment
        </div>
        <div
          className={`mt-1.5 text-2xl font-bold leading-tight ${
            level === "high" ? "animate-pulse-high" : ""
          }`}
          style={{ color: `rgb(var(--${color}))` }}
        >
          {LABELS[level]}
        </div>
        <div className="mt-0.5 text-base text-muted">
          {prediction ? (
            <>
              <span className="font-mono tabular-nums">
                <AnimatedNumber value={pct} digits={1} />%
              </span>{" "}
              probability
            </>
          ) : (
            "Awaiting data"
          )}
        </div>
      </div>

      <div className="mx-auto sm:mx-0">
        <Gauge value={pct} color={color} size={130} />
      </div>
    </div>
  );
}