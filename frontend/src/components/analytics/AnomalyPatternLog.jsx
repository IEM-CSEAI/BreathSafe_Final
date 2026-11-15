import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import AnalyticsCard from "./AnalyticsCard";

const LEVEL = {
  warning: { Icon: AlertTriangle, text: "text-warn", bg: "bg-warn/10", border: "border-l-warn" },
  success: { Icon: CheckCircle2,  text: "text-ok",   bg: "bg-ok/10",   border: "border-l-ok" },
  tip:     { Icon: Lightbulb,     text: "text-info", bg: "bg-info/10", border: "border-l-info" },
};

export default function AnomalyPatternLog({ insights, loading }) {
  return (
    <AnalyticsCard
      title="Anomaly & clinical pattern log"
      subtitle="Rule-based pattern synthesis"
      right={
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-bold text-muted">
          RULE-BASED
        </span>
      }
    >
      {!insights ? (
        <div className="flex flex-1 flex-col justify-center space-y-2 py-1">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-12 w-full rounded-lg" />
          ))}
          {!loading && <div className="text-center text-xs font-semibold text-muted">No insights yet</div>}
        </div>
      ) : (
        <ul className="flex flex-1 min-h-0 flex-col justify-start space-y-2 overflow-y-auto pr-1">
          {insights.map((it, i) => {
            const s = LEVEL[it.level] || LEVEL.tip;
            return (
              <li
                key={i}
                className={`rounded-lg border border-border border-l-4 bg-surface p-2.5 shadow-xs ${s.border}`}
              >
                <div className="flex items-start gap-2">
                  <div className={`rounded p-1 ${s.bg} shrink-0`}>
                    <s.Icon size={15} className={s.text} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-fg leading-tight">
                      {it.title}
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted line-clamp-2">
                      {it.text}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AnalyticsCard>
  );
}