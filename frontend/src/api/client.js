async function get(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

export const fetchLive = () => get("/api/live");
export const fetchHistory = (minutes = 30) => get(`/api/history?minutes=${minutes}`);
export const fetchHealth = () => get("/api/health");

export const fetchAnalytics = (range) => {
  const q =
    range.preset === "custom"
      ? `start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`
      : `range=${range.preset}`;
  return get(`/api/analytics?${q}`);
};
export const fetchHeatmap = () => get("/api/analytics/heatmap");