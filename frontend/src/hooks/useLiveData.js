import { useCallback, useEffect, useState } from "react";
import { fetchHistory, fetchLive } from "../api/client";

const POLL_MS = 5000;

export function useLiveData() {
  const [live, setLive] = useState(null);
  const [trail, setTrail] = useState([]);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [l, h] = await Promise.all([fetchLive(), fetchHistory(5)]);
      setLive(l);
      setTrail(h.points.slice(-20));
      setError(false);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [paused, refresh]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  let connection = "live";
  if (error) connection = "offline";
  else if (paused) connection = "paused";
  else if (loading) connection = "connecting";
  else if (live?.status !== "live") connection = "waiting";
  else if (live.stale) connection = "stale";

  const dataAge = live?.data_age_seconds ?? null;

  return {
    live, trail, loading, connection, dataAge,
    paused, togglePause, refresh, lastUpdated,
  };
}