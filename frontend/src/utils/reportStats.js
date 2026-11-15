// Summary numbers for the report, computed from the analytics points.
// Shares are fractions of readings, so they approximate time in each state.
export function summarize(points = []) {
  if (!points.length) return null;
  const n = points.length;

  const avg = (k) => points.reduce((a, p) => a + p[k], 0) / n;
  const peakOf = (k) => points.reduce((best, p) => (p[k] > best[k] ? p : best), points[0]);
  const share = (fn) => (points.filter(fn).length / n) * 100;

  const counts = {};
  points.forEach((p) => {
    counts[p.disease] = (counts[p.disease] || 0) + 1;
  });
  const [topName, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return {
    n,
    risk: { avg: avg("risk"), peak: peakOf("risk") },
    co2: { avg: avg("co2"), peak: peakOf("co2") },
    pm25: { avg: avg("pm25"), peak: peakOf("pm25") },
    moderatePlus: share((p) => p.risk >= 40),
    high: share((p) => p.risk >= 70),
    co2Over: share((p) => p.co2 > 1000),
    pmOver: share((p) => p.pm25 > 35),
    top: { name: topName, share: (topCount / n) * 100 },
  };
}