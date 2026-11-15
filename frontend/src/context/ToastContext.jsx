import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);
let nextId = 1;
let audioCtx;

function beep(type) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = type === "danger" ? 880 : 560;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.18);
  } catch {}
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [sound, setSound] = useState(() => localStorage.getItem("breathsafe-sound") === "on");
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const dismiss = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  const push = useCallback(
    ({ type = "info", title, message, duration = 8000 }) => {
      const id = nextId++;
      setToasts((t) => [...t.slice(-3), { id, type, title, message }]);
      if (soundRef.current && (type === "danger" || type === "warn")) beep(type);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    setSound(next);
    localStorage.setItem("breathsafe-sound", next ? "on" : "off");
    if (next) beep("warn");
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss, sound, toggleSound }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);