import { STATUS } from "../../utils/thresholds";

export default function StatusPill({ status = "normal", className = "" }) {
  const s = STATUS[status] ?? STATUS.normal;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wider ${s.pill} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}