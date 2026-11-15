export default function DiseaseCard({ prediction }) {
  const low = prediction?.risk_level === "low";

  return (
    <div
      className={`tint-card rounded-xl border-[1.5px] border-info bg-surface p-4 transition-opacity duration-300 ${
        low ? "opacity-70 hover:opacity-100" : ""
      }`}
      style={{
        boxShadow: low ? "none" : "0 0 18px rgb(var(--info) / 0.25)",
        "--tint": "var(--info)",
      }}
    >
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {low ? "Most likely if exposure continues" : "Predicted Condition / Pathogen"}
      </div>

      <div className="mt-1.5 font-diagnosis text-2xl font-bold leading-tight text-info">
        {prediction ? prediction.disease_display : "–"}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {prediction && !low && (
          <span className="rounded-full border border-info bg-info/15 px-3 py-0.5 font-mono text-xs font-bold tabular-nums tracking-wider text-info">
            CONF {(prediction.disease_confidence * 100).toFixed(1)}%
          </span>
        )}
        {prediction && low && (
          <span className="rounded-full border border-border px-3 py-0.5 text-xs font-bold tracking-wider text-muted">
            REFERENCE ONLY
          </span>
        )}
        <span className="text-xs tracking-wider text-muted">
          {low ? "◈ Risk is low right now" : "◈ 16-feature sensor matrix"}
        </span>
      </div>
    </div>
  );
}