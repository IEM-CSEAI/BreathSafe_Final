import { useEffect, useRef } from "react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { SENSORS } from "../utils/thresholds";

const RANK = { low: 0, moderate: 1, high: 2 };
const COOLDOWN_MS = 60_000;

export function useAlerts() {
  const { live, connection } = useData();
  const { push } = useToast();
  const prev = useRef({ ready: false, level: null, statuses: {}, connection: null, fired: {} });

  useEffect(() => {
    const p = prev.current;

    const fire = (key, opts) => {
      const now = Date.now();
      if (now - (p.fired[key] || 0) < COOLDOWN_MS) return;
      p.fired[key] = now;
      push(opts);
    };

    // Connection changes
    if (p.connection && p.connection !== connection) {
      if (connection === "offline") {
        fire("offline", {
          type: "danger",
          title: "Connection lost",
          message: "Backend is not responding. Retrying automatically.",
        });
      } else if (p.connection === "offline") {
        push({ type: "ok", title: "Reconnected", message: "Live data is flowing again." });
      }
    }
    p.connection = connection;

    if (live?.status !== "live" || !live.prediction) return;

    // Risk level changes
    const level = live.prediction.risk_level;
    const pct = (live.prediction.risk_probability * 100).toFixed(1);
    const disease = live.prediction.disease_display;

    if (p.level === null) {
      if (level === "high") {
        fire("risk-up", { type: "danger", title: "High infection risk", message: `${pct}% · ${disease}` });
      }
    } else if (RANK[level] > RANK[p.level]) {
      fire("risk-up", {
        type: level === "high" ? "danger" : "warn",
        title: level === "high" ? "High infection risk" : "Risk rising to moderate",
        message: `${pct}% · ${disease}`,
      });
    } else if (RANK[level] < RANK[p.level]) {
      fire("risk-down", { type: "ok", title: `Risk decreased to ${level}`, message: `${pct}%` });
    }
    p.level = level;

    // Sensors that just turned HIGH (skipped on the very first reading)
    if (p.ready) {
      SENSORS.forEach((def) => {
        if (!def.status) return;
        const now = live.statuses[def.status];
        if (now === "high" && p.statuses[def.status] !== "high") {
          fire(`sensor-${def.id}`, {
            type: "warn",
            title: `${def.label} is HIGH`,
            message: `${Number(live.sensors[def.field]).toFixed(def.digits)} ${def.unit}`.trim(),
          });
        }
      });
    }
    p.statuses = { ...live.statuses };
    p.ready = true;
  }, [live, connection, push]);
}