import { Pause, Play, RefreshCw } from "lucide-react";
import { useData } from "../../context/DataContext";
import { CONNECTION } from "../../utils/thresholds";

export default function StatusBadge() {
  const { connection, paused, togglePause, refresh, lastUpdated } = useData();
  const c = CONNECTION[connection];

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition hover:border-accent hover:text-accent";

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em]">Data Feed</div>
          <div className="mt-0.5 flex items-center gap-2 text-lg font-bold leading-tight">
            <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
            {c.label}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] tabular-nums text-muted">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "No data yet"}
          </div>
        </div>
        <div className="flex gap-2">
          <button className={btn} onClick={togglePause} title={paused ? "Resume" : "Pause"}>
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button className={btn} onClick={refresh} title="Refresh now">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}