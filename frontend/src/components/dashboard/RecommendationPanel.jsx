import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";

// Full class names are written out so Tailwind can detect them.
const SEV = {
  high:     { rank: 0, tag: "HIGH",      Icon: OctagonAlert,  text: "text-danger", accent: "border-l-danger", pill: "bg-danger/15 text-danger" },
  moderate: { rank: 1, tag: "MEDIUM",    Icon: AlertTriangle, text: "text-warn",   accent: "border-l-warn",   pill: "bg-warn/15 text-warn" },
  info:     { rank: 2, tag: "INFO",      Icon: Info,          text: "text-info",   accent: "border-l-info",   pill: "bg-info/15 text-info" },
  ok:       { rank: 3, tag: "ALL CLEAR", Icon: CheckCircle2,  text: "text-ok",     accent: "border-l-ok",     pill: "bg-ok/15 text-ok" },
};

function severityOf(text) {
  const t = text.toLowerCase();
  if (/\bhigh\b|unhealthy/.test(t)) return "high";
  if (/\b(elevated|moderate|low)\b/.test(t)) return "moderate";
  if (/\bgood\b|no action/.test(t)) return "ok";
  return "info";
}

// "CO2 is elevated: increase ventilation." -> title + action
function splitTip(text) {
  const i = text.indexOf(":");
  if (i === -1) return { title: text, action: "" };
  return { title: text.slice(0, i).trim(), action: text.slice(i + 1).trim() };
}

export default function RecommendationPanel({ items = [] }) {
  const tips = items
    .map((t) => ({ ...splitTip(t), sev: severityOf(t) }))
    .sort((a, b) => SEV[a.sev].rank - SEV[b.sev].rank);

  const attention = tips.filter((t) => t.sev === "high" || t.sev === "moderate").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Recommendations</span>
        {tips.length > 0 && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${
              attention > 0
                ? "border-warn/40 bg-warn/10 text-warn"
                : "border-ok/40 bg-ok/10 text-ok"
            }`}
          >
            {attention > 0 ? `${attention} NEED ATTENTION` : "ALL GOOD"}
          </span>
        )}
      </div>

      {tips.length === 0 ? (
        <div className="text-sm text-muted">Waiting for sensor data…</div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-0.5">
          {tips.map((t, i) => {
            const s = SEV[t.sev];
            return (
              <li
                key={i}
                className={`rounded-xl border border-l-4 border-border bg-surface p-2.5 dark:bg-bg/60 ${s.accent}`}
              >
                <div className="flex items-start gap-2">
                  <s.Icon size={17} className={`icon-glow mt-0.5 shrink-0 ${s.text}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13px] font-semibold leading-snug text-fg">
                        {t.title}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${s.pill}`}
                      >
                        {s.tag}
                      </span>
                    </div>
                    {t.action && (
                      <p className="mt-1 text-xs leading-snug text-muted">{t.action}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}