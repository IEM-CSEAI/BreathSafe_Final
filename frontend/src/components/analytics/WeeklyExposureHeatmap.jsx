import { useMemo } from "react";
import AnalyticsCard from "./AnalyticsCard";
import { mockCell } from "../../utils/mockWeeklyHistory";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n) => String(n).padStart(2, "0");
const hourLabel = (h) => (h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`);
const levelOf = (r) => (r >= 70 ? "high" : r >= 40 ? "moderate" : "low");

const LEVEL = {
  low:      "bg-ok/30 text-ok",
  moderate: "bg-warn/40 text-fg font-bold",
  high:     "bg-danger text-white font-bold",
};

function dominant(c) {
  const co2 = c.co2 / 1000;
  const pm = c.pm25 / 35;
  if (co2 < 1 && pm < 1) return "safe limits";
  return co2 >= pm ? `CO₂ ${Math.round(c.co2)} ppm` : `PM2.5 ${c.pm25} µg/m³`;
}

function Swatch({ cls, text, dashed }) {
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-muted">
      <span
        className={`h-2.5 w-2.5 rounded-xs ${cls} ${
          dashed ? "border border-dashed border-muted" : "shadow-xs"
        }`}
      />
      {text}
    </span>
  );
}

export default function WeeklyExposureHeatmap({ data, loading, error }) {
  const grid = useMemo(() => {
    if (!data) return null;
    const hours = [];
    for (let h = data.first_hour; h <= data.last_hour; h++) hours.push(h);

    const real = new Map(data.cells.map((c) => [`${c.day}-${c.hour}`, c]));
    const now = new Date(data.now);
    const today = (now.getDay() + 6) % 7;
    const [y, m, d] = data.week_start.split("-").map(Number);
    let anyDemo = false;

    const rows = DAYS.map((name, day) => {
      const date = new Date(y, m - 1, d + day);
      const cells = hours.map((hour) => {
        let cell = real.get(`${day}-${hour}`) ?? null;
        if (!cell && day < today) {
          cell = mockCell(day, hour);
          anyDemo = true;
        }
        if (day > today || (day === today && hour > now.getHours())) cell = null;
        return { hour, cell };
      });
      return { name, date, cells };
    });
    return { hours, rows, anyDemo };
  }, [data]);

  let body;
  if (!grid) {
    body = (
      <div className="flex flex-1 items-center justify-center text-xs font-semibold text-muted">
        {error ? "Could not load heatmap." : loading ? "Loading weekly grid…" : "No data yet"}
      </div>
    );
  } else {
    body = (
      <div className="flex flex-1 min-h-0 flex-col justify-between gap-1.5">
        {/* Heatmap Matrix: Flexibly fills available space without vertical scroll */}
        <div
          className="grid flex-1 min-h-0 gap-1 overflow-hidden"
          style={{
            gridTemplateColumns: `30px repeat(${grid.hours.length}, minmax(0, 1fr))`,
            gridTemplateRows: `16px repeat(${grid.rows.length}, minmax(0, 1fr))`,
          }}
          role="table"
          aria-label="Weekly exposure heatmap"
        >
          <div />
          {grid.hours.map((h) => (
            <div key={h} className="text-center font-mono text-[10px] font-bold text-muted">
              {hourLabel(h)}
            </div>
          ))}

          {grid.rows.map((row) => (
            <div key={row.name} className="contents" role="row">
              <div className="flex items-center text-[11px] font-bold text-fg">
                {row.name}
              </div>
              {row.cells.map(({ hour, cell }) => {
                if (!cell) {
                  return (
                    <div
                      key={hour}
                      className="h-full w-full rounded-sm border border-dashed border-border/70"
                      title={`${row.name} ${pad(hour)}:00 · no data`}
                    />
                  );
                }
                const lvl = levelOf(cell.risk);
                const tip = `${row.name} ${pad(hour)}:00 · avg ${cell.risk}% · ${dominant(cell)}`;
                return (
                  <div
                    key={hour}
                    role="cell"
                    aria-label={tip}
                    title={tip}
                    className={`flex h-full w-full items-center justify-center rounded-sm font-mono text-[10px] font-bold transition hover:scale-105 ${LEVEL[lvl]} ${
                      cell.demo ? "opacity-75" : ""
                    }`}
                  >
                    <span className="hidden 2xl:inline">{Math.round(cell.risk)}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend cleanly anchored at card bottom without touching the footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between border-t border-border/40 pt-1.5">
          <div className="flex items-center gap-3">
            <Swatch cls="bg-ok/30" text="Low (<40%)" />
            <Swatch cls="bg-warn/40" text="Mod (40-70%)" />
            <Swatch cls="bg-danger" text="High (≥70%)" />
            <Swatch cls="bg-transparent" dashed text="No data" />
          </div>
          {grid.anyDemo && (
            <span className="rounded-full border border-info/40 bg-info/10 px-2 py-0.5 text-[10px] font-bold text-info">
              DEMO HISTORY
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <AnalyticsCard
      title="Weekly exposure heatmap"
      subtitle="Infection risk per hour, current week (8 AM – 8 PM)"
    >
      {body}
    </AnalyticsCard>
  );
}