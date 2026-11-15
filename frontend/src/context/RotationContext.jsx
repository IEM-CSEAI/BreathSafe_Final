import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "./DataContext";

// Pages in rotation order, and how long each stays on screen. Edit freely.
export const ROTATION = {
  pages: [
    { path: "/", seconds: 30 },
    { path: "/analytics", seconds: 45 },
  ],
  idleResumeSeconds: 30,  // after someone touches the page, wait this long before rotating again
  holdOnHighRisk: true,   // stay on the dashboard while risk is HIGH
};

const KEY = "breathsafe-rotate";
const RotationContext = createContext(null);

function initialEnabled() {
  const tv = new URLSearchParams(window.location.search).get("tv");
  if (tv === "1") { localStorage.setItem(KEY, "on"); return true; }
  if (tv === "0") { localStorage.setItem(KEY, "off"); return false; }
  return localStorage.getItem(KEY) === "on";
}

export function RotationProvider({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { live } = useData();

  const [enabled, setEnabled] = useState(initialEnabled);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const idleTimer = useRef(0);

  const index = ROTATION.pages.findIndex((p) => p.path === pathname);
  const hold =
    ROTATION.holdOnHighRisk && pathname === "/" && live?.prediction?.risk_level === "high";
  const active = enabled && !paused && !hold && index !== -1;

  // slide to the next page when the dwell time is up
  useEffect(() => {
    if (!active) return;
    const next = ROTATION.pages[(index + 1) % ROTATION.pages.length];
    const id = setTimeout(() => navigate(next.path), ROTATION.pages[index].seconds * 1000);
    return () => clearTimeout(id);
  }, [active, index, run, navigate]);

  // pause while someone is using the page
  useEffect(() => {
    if (!enabled) return;
    const onActivity = () => {
      setPaused(true);
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setPaused(false);
        setRun((r) => r + 1);
      }, ROTATION.idleResumeSeconds * 1000);
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearTimeout(idleTimer.current);
    };
  }, [enabled]);

  const toggle = useCallback(() => {
    const next = !enabled;
    localStorage.setItem(KEY, next ? "on" : "off");
    clearTimeout(idleTimer.current);
    setPaused(false);
    setRun((r) => r + 1);
    setEnabled(next);
  }, [enabled]);

  return (
    <RotationContext.Provider
      value={{
        enabled, active, paused, hold, toggle, run, pathname,
        seconds: ROTATION.pages[index]?.seconds,
      }}
    >
      {children}
    </RotationContext.Provider>
  );
}

export const useRotation = () => useContext(RotationContext);