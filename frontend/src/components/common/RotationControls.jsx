import { Tv } from "lucide-react";
import { useRotation } from "../../context/RotationContext";

export function RotationToggle() {
  const { enabled, paused, toggle } = useRotation();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title={
        enabled
          ? paused
            ? "Auto-rotate paused while the page is in use"
            : "Auto-rotate on · click to stop"
          : "Start auto-rotate (TV mode)"
      }
      className={`nav-btn relative hidden h-9 w-9 items-center justify-center rounded-lg transition sm:flex ${
        enabled ? "ring-2 ring-white/70 dark:ring-emerald-400/70" : ""
      }`}
    >
      <Tv size={18} />
      {enabled && paused && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
      )}
    </button>
  );
}

// Thin progress line along the bottom edge of the navbar
export function RotationBar() {
  const { enabled, active, seconds, run, pathname } = useRotation();
  if (!enabled) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden bg-white/10">
      {active && seconds && (
        <div
          key={`${pathname}-${run}`}
          className="rotation-bar h-full w-full bg-white/80 dark:bg-emerald-400"
          style={{ animationDuration: `${seconds}s` }}
        />
      )}
    </div>
  );
}