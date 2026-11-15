import { useEffect, useState } from "react";
import { useAnalytics, useHeatmap } from "../hooks/useAnalytics";
import { exportCsv } from "../utils/exportCsv";
import AnalyticsHeader from "../components/analytics/AnalyticsHeader";
import RiskCorrelationChart from "../components/analytics/RiskCorrelationChart";
import VentilationGauge from "../components/analytics/VentilationGauge";
import WeeklyExposureHeatmap from "../components/analytics/WeeklyExposureHeatmap";
import AnomalyPatternLog from "../components/analytics/AnomalyPatternLog";
import ReportView from "../components/analytics/ReportView";

// Fades a widget in; i = position in the sequence.
function Slot({ i, children }) {
  return (
    <div
      className="reveal flex min-h-0 flex-col [&>*]:min-h-0 [&>*]:flex-1"
      style={{ "--i": i }}
    >
      {children}
    </div>
  );
}

export default function Analytics() {
  const [range, setRange] = useState({ preset: "24h" });
  const [printing, setPrinting] = useState(false);
  const a = useAnalytics(range);
  const h = useHeatmap();
  const d = a.data;

  // Mount the report, give it a moment to lay out, open the print dialog, then unmount.
  useEffect(() => {
    if (!printing) return;
    const prevTitle = document.title;
    document.title = `BreathSafe-report-${new Date().toISOString().slice(0, 10)}`;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    const id = setTimeout(() => window.print(), 400);
    return () => {
      clearTimeout(id);
      window.removeEventListener("afterprint", done);
      document.title = prevTitle;
    };
  }, [printing]);

  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[560px]">
      <AnalyticsHeader
        range={range}
        onChange={setRange}
        canExport={!!d?.points?.length}
        onExportPdf={() => setPrinting(true)}
        onExportCsv={() => exportCsv(d.points, `breathsafe-${range.preset}.csv`)}
      />

      {a.error && !d && (
        <div className="rounded-lg border border-danger bg-danger/10 px-4 py-2 text-sm text-danger">
          Could not load analytics. Check that the backend is running
          {range.preset === "custom" ? " and that the date range is valid" : ""}.
        </div>
      )}

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-2">
        <Slot i={0}>
          <RiskCorrelationChart
            points={d?.points}
            events={d?.events}
            loading={a.loading}
            error={a.error}
          />
        </Slot>
        <Slot i={1}>
          <VentilationGauge ventilation={d?.ventilation} dose={d?.dose} loading={a.loading} />
        </Slot>
        <Slot i={2}>
          <WeeklyExposureHeatmap data={h.data} loading={h.loading} error={h.error} />
        </Slot>
        <Slot i={3}>
          <AnomalyPatternLog insights={d?.insights} loading={a.loading} />
        </Slot>
      </div>

      {printing && d && <ReportView analytics={d} heatmap={h.data} />}
    </div>
  );
}