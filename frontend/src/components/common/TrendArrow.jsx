import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

export default function TrendArrow({ values = [] }) {
  const clean = values.filter((v) => typeof v === "number");
  if (clean.length < 4) {
    return <ArrowRight size={14} className="text-muted" />;
  }

  const cur = clean[clean.length - 1];
  const prev = clean.slice(-4, -1);
  const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
  const pct = avg !== 0 ? ((cur - avg) / Math.abs(avg)) * 100 : 0;

  if (Math.abs(pct) < 2) {
    return <ArrowRight size={14} className="text-muted" title="Stable" />;
  }

  const up = pct > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className="flex items-center gap-0.5 font-mono text-[11px] font-bold tabular-nums text-fg"
      title={`${up ? "Rising" : "Falling"} ${Math.abs(pct).toFixed(1)}% vs last readings`}
    >
      <Icon size={14} />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}