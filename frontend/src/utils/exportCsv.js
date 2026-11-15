export function exportCsv(points, filename) {
  const rows = [
    "timestamp,co2_ppm,pm25_ug_m3,risk_percent,predicted_condition",
    ...points.map((p) => `${p.t},${p.co2},${p.pm25},${p.risk},"${p.disease}"`),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}