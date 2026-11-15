import { createPortal } from "react-dom";
import ReportChart from "./ReportChart";
import VentilationGauge from "./VentilationGauge";
import WeeklyExposureHeatmap from "./WeeklyExposureHeatmap";
import AnomalyPatternLog from "./AnomalyPatternLog";
import { summarize } from "../../utils/reportStats";

const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString([], {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] leading-snug text-muted">{sub}</div>}
    </div>
  );
}

function Title({ children }) {
  return (
    <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em]">{children}</h2>
  );
}

function LegendDot({ color, text }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-muted">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {text}
    </span>
  );
}

export default function ReportView({ analytics, heatmap }) {
  const s = summarize(analytics?.points);

  return createPortal(
    <div className="print-root report-light">
      {/* ---------- header ---------- */}
      <div className="flex items-end justify-between border-b-2 border-accent pb-2">
        <div>
          <div className="font-display text-2xl font-extrabold tracking-tight">
            BreathSafe<span className="text-accent">.</span>
          </div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Airborne Disease Analytics Report
          </div>
        </div>
        <div className="text-right text-[11px] leading-snug text-muted">
          <div>Generated {fmtDateTime(new Date().toISOString())}</div>
          <div>
            Period: {fmtDateTime(analytics.start)} to {fmtDateTime(analytics.end)}
          </div>
          <div>{analytics.count} minutes of readings</div>
        </div>
      </div>

      {/* ---------- summary ---------- */}
      {s ? (
        <section className="report-section mt-3">
          <Title>Summary</Title>
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Average risk" value={`${s.risk.avg.toFixed(1)}%`} />
            <Stat
              label="Peak risk"
              value={`${s.risk.peak.risk.toFixed(1)}%`}
              sub={fmtDateTime(s.risk.peak.t)}
            />
            <Stat label="Time at moderate+ risk" value={`${s.moderatePlus.toFixed(0)}%`} sub="risk ≥ 40%" />
            <Stat label="Time at high risk" value={`${s.high.toFixed(0)}%`} sub="risk ≥ 70%" />
            <Stat
              label="CO₂ avg / peak"
              value={`${s.co2.avg.toFixed(0)} / ${s.co2.peak.co2.toFixed(0)}`}
              sub="ppm"
            />
            <Stat
              label="PM2.5 avg / peak"
              value={`${s.pm25.avg.toFixed(1)} / ${s.pm25.peak.pm25.toFixed(1)}`}
              sub="µg/m³"
            />
            <Stat label="CO₂ above 1000 ppm" value={`${s.co2Over.toFixed(0)}%`} sub="of the period" />
            <Stat
              label="Most common condition"
              value={<span className="font-sans text-sm">{s.top.name}</span>}
              sub={`${s.top.share.toFixed(0)}% of readings`}
            />
          </div>
        </section>
      ) : (
        <p className="mt-3 text-sm text-muted">No readings in this period.</p>
      )}

      {/* ---------- chart ---------- */}
      <section className="report-section mt-4">
        <Title>Risk &amp; telemetry correlation</Title>
        <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1">
          <LegendDot color="rgb(var(--danger))" text="CO₂ ppm (left axis)" />
          <LegendDot color="rgb(var(--warn))" text="PM2.5 µg/m³" />
          <LegendDot color="rgb(var(--chart-6))" text="Infection risk %" />
        </div>
        <div className="rounded-xl border border-border p-2">
          <ReportChart points={analytics.points} events={analytics.events} />
        </div>
        <p className="mt-1 text-[10px] text-muted">
          Dashed markers are inferred from CO₂ / PM2.5 patterns. The system has no occupancy or
          purifier sensor.
        </p>
      </section>

      {/* ---------- ventilation ---------- */}
      <section className="report-section mt-4">
        <VentilationGauge ventilation={analytics.ventilation} dose={analytics.dose} />
      </section>

      {/* ---------- heatmap ---------- */}
      <section className="report-section mt-4 flex h-[300px] flex-col [&>*]:flex-1">
        <WeeklyExposureHeatmap data={heatmap} />
      </section>

      {/* ---------- findings ---------- */}
      <section className="report-section mt-4">
        <AnomalyPatternLog insights={analytics.insights} />
      </section>

      <p className="mt-4 border-t border-border pt-2 text-[10px] leading-snug text-muted">
        BreathSafe is a research prototype. Risk percentages come from a machine-learning model
        trained on environmental readings and are not a medical diagnosis. Air changes per hour
        are estimated from CO₂ decay, and the exposure figure is a CO₂-based proxy for shared
        air, not a pathogen dose.
      </p>
    </div>,
    document.body
  );
}