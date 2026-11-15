import { useEffect, useState } from "react";
import { fetchAnalytics, fetchHeatmap } from "../api/client";

const cache = new Map();

function usePolled(key, loader, ms) {
  const [data, setData] = useState(() => cache.get(key) ?? null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(() => !cache.has(key));

  useEffect(() => {
    let cancelled = false;
    setData(cache.get(key) ?? null);
    setLoading(!cache.has(key));

    const run = () =>
      loader()
        .then((d) => {
          if (cancelled) return;
          cache.set(key, d);
          setData(d);
          setError(false);
        })
        .catch(() => !cancelled && setError(true))
        .finally(() => !cancelled && setLoading(false));

    run();
    const id = setInterval(run, ms);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, error };
}

export function useAnalytics(range) {
  const key = range.preset === "custom" ? `custom:${range.start}:${range.end}` : range.preset;
  return usePolled(`analytics:${key}`, () => fetchAnalytics(range), 30_000);
}

export function useHeatmap() {
  return usePolled("heatmap", fetchHeatmap, 60_000);
}