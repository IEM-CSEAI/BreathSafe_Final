import { AlertTriangle, Clock, WifiOff } from "lucide-react";
import { formatAge } from "../../utils/age";

export default function AlertBanner({ connection, riskLevel, dataAge }) {
  if (connection === "offline") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-danger bg-danger/10 px-4 py-2 text-sm text-danger">
        <WifiOff size={18} />
        CONNECTION LOST — backend not responding. Retrying automatically…
      </div>
    );
  }
  if (connection === "stale") {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-lg border border-warn bg-warn/10 px-4 py-2 text-sm text-warn"
      >
        <Clock size={18} className="shrink-0" />
        NO NEW SENSOR DATA FOR {formatAge(dataAge).toUpperCase()} — showing the last readings.
        Check that the sensors are powered and connected.
      </div>
    );
  }
  if (riskLevel === "high") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-danger bg-danger/10 px-4 py-2 text-sm text-danger">
        <AlertTriangle size={18} className="animate-pulse-high" />
        HIGH INFECTION RISK DETECTED — see recommendations.
      </div>
    );
  }
  return null;
}