import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Activity, LayoutDashboard } from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";
import SoundToggle from "../common/SoundToggle";
import { RotationBar, RotationToggle } from "../common/RotationControls";
import { useData } from "../../context/DataContext";
import { CONNECTION } from "../../utils/thresholds";

const DOT = {
  live:       { color: "--nav-ok",     blink: true },
  connecting: { color: "--nav-warn" },
  waiting:    { color: "--nav-warn" },
  stale:      { color: "--nav-warn" },
  paused:     { color: "--nav-muted" },
  offline:    { color: "--nav-danger" },
};

const STALE_AFTER_S = 15;

const linkClass = ({ isActive }) =>
  `nav-link flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm tracking-wider transition ${
    isActive ? "nav-link-active" : ""
  }`;

function useSecondsSince(date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return date ? Math.max(0, Math.floor((now - date.getTime()) / 1000)) : null;
}

function formatAgo(s) {
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ${s % 60}s ago`;
}

export default function Navbar() {
  const { connection, lastUpdated } = useData();
  const dot = DOT[connection] ?? DOT.connecting;
  const secs = useSecondsSince(lastUpdated);
  const stale = secs !== null && secs > STALE_AFTER_S && connection !== "paused";

  return (
    <header className="nav-shell sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="nav-logo font-display text-xl font-extrabold tracking-tight sm:text-2xl">
            BreathSafe<span className="nav-logo-dot">.</span>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard size={16} /> <span className="hidden sm:inline">DASHBOARD</span>
            </NavLink>
            <NavLink to="/analytics" className={linkClass}>
              <Activity size={16} /> <span className="hidden sm:inline">ANALYTICS</span>
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="nav-status hidden flex-col items-end leading-tight sm:flex">
            <span className="flex items-center gap-2 text-xs tracking-widest">
              <span
                className={`h-2 w-2 rounded-full ${dot.blink ? "animate-blink" : ""}`}
                style={{ background: `rgb(var(${dot.color}))` }}
              />
              {CONNECTION[connection]?.label}
            </span>
            <span
              className="mt-0.5 font-mono text-[11px] tabular-nums tracking-wider"
              style={stale ? { color: "rgb(var(--nav-warn))" } : undefined}
              title={lastUpdated ? lastUpdated.toLocaleString() : "No data yet"}
            >
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}${
                    connection !== "paused" ? ` · ${formatAgo(secs)}` : ""
                  }`
                : "No data yet"}
            </span>
          </div>
          <RotationToggle />
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>
      <RotationBar />
    </header>
  );
}