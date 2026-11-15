import Sparkline from "../charts/Sparkline";
import AnimatedNumber from "../common/AnimatedNumber";
import TrendArrow from "../common/TrendArrow";
import StatusPill from "./StatusPill";
import { STATUS } from "../../utils/thresholds";
import { useTheme } from "../../hooks/useTheme";

export default function SensorTile({
  label, unit, value, digits = 1, status = "normal", trail = [], chart, stale = false, onClick,
}) {
  const { theme } = useTheme();
  const s = STATUS[status] ?? STATUS.normal;
  // light: blue variations · dark: green / amber / red by status
  const sparkColor = theme === "light" && chart ? chart : s.color;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col rounded-xl border border-border bg-surface p-3 text-left transition
                 hover:-translate-y-0.5 hover:border-accent hover:shadow-md
                 focus:outline-none focus-visible:border-accent"
    >
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-xs font-bold uppercase tracking-[0.08em]">{label}</span>
        {stale ? (
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-semibold tracking-wider text-muted">
            STALE
          </span>
        ) : (
          <StatusPill status={status} />
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <span
          className={`font-mono text-2xl font-bold leading-none tabular-nums sm:text-3xl ${s.text}`}
        >
          <AnimatedNumber value={value} digits={digits} />
        </span>
        <span className="text-xs text-muted">{unit}</span>
        <span className="ml-auto self-center">
          <TrendArrow values={trail} />
        </span>
      </div>

      <div className="relative mt-2 min-h-8 flex-1">
        <Sparkline
          values={trail}
          color={sparkColor}
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </button>
  );
}