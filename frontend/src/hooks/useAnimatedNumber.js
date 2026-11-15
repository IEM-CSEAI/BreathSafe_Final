import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(target, duration = 600) {
  const isNum = typeof target === "number" && !Number.isNaN(target);
  const [display, setDisplay] = useState(isNum ? target : 0);
  const fromRef = useRef(isNum ? target : 0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!isNum) return;
    const from = fromRef.current;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      fromRef.current = v;
      setDisplay(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, isNum]);

  return display;
}