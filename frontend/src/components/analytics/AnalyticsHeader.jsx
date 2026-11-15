import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";

const PRESETS = [
  { id: "24h", label: "Last 24h" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "custom", label: "Custom Range" },
];

const pad = (n) => String(n).padStart(2, "0");
const toInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const inputCls =
  "rounded-lg border border-border bg-surface px-2 py-1 font-mono text-xs text-fg focus:border-accent focus:outline-none";

function ExportMenu({ canExport, onPdf, onCsv }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-accent/10";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!canExport}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-fg shadow-sm transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={14} /> Export Report <ChevronDown size={13} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-xl border border-border bg-surface p-1 shadow-xl"
        >
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onPdf();
            }}
          >
            <FileText size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>
              <span className="block text-xs font-semibold">PDF report</span>
              <span className="block text-[11px] leading-snug text-muted">
                Summary, chart, heatmap and findings. Opens the print dialog: choose “Save as PDF”.
              </span>
            </span>
          </button>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onCsv();
            }}
          >
            <FileSpreadsheet size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>
              <span className="block text-xs font-semibold">CSV data</span>
              <span className="block text-[11px] leading-snug text-muted">
                Time, CO₂, PM2.5, risk % and predicted condition for spreadsheets.
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsHeader({ range, onChange, onExportPdf, onExportCsv, canExport }) {
  const pick = (id) => {
    if (id !== "custom") return onChange({ preset: id });
    const end = new Date();
    onChange({
      preset: "custom",
      start: toInput(new Date(end.getTime() - 24 * 3600e3)),
      end: toInput(end),
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
        Airborne Disease Analytics &amp; Clinical Insights
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {range.preset === "custom" && (
          <div className="flex items-center gap-1.5">
            <input
              type="datetime-local"
              value={range.start}
              max={range.end}
              onChange={(e) => onChange({ ...range, start: e.target.value })}
              className={inputCls}
              aria-label="Start"
            />
            <span className="text-xs text-muted">to</span>
            <input
              type="datetime-local"
              value={range.end}
              min={range.start}
              onChange={(e) => onChange({ ...range, end: e.target.value })}
              className={inputCls}
              aria-label="End"
            />
          </div>
        )}

        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p.id)}
              className={`rounded-lg px-3 py-1.5 text-xs transition ${
                range.preset === p.id
                  ? "bg-accent font-semibold text-white dark:text-bg"
                  : "border border-border text-muted hover:text-fg"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <ExportMenu canExport={canExport} onPdf={onExportPdf} onCsv={onExportCsv} />
      </div>
    </div>
  );
}