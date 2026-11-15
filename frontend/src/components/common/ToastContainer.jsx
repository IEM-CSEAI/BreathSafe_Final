import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const STYLE = {
  danger: { border: "border-danger", text: "text-danger", Icon: OctagonAlert },
  warn:   { border: "border-warn",   text: "text-warn",   Icon: AlertTriangle },
  ok:     { border: "border-ok",     text: "text-ok",     Icon: CheckCircle2 },
  info:   { border: "border-info",   text: "text-info",   Icon: Info },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const s = STYLE[t.type] ?? STYLE.info;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto animate-toast-in flex items-start gap-3 rounded-lg border border-l-4 bg-surface p-3 shadow-xl ${s.border}`}
          >
            <s.Icon size={20} className={`mt-0.5 shrink-0 ${s.text}`} />
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-bold ${s.text}`}>{t.title}</div>
              {t.message && <div className="mt-0.5 text-xs text-muted">{t.message}</div>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-muted transition hover:text-fg"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}