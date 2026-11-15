import { useState } from "react";
import { useData } from "../context/DataContext";
import { SENSORS } from "../utils/thresholds";
import { formatAge } from "../utils/age";
import AlertBanner from "../components/common/AlertBanner";
import RiskCard from "../components/dashboard/RiskCard";
import DiseaseCard from "../components/dashboard/DiseaseCard";
import SensorTile from "../components/dashboard/SensorTile";
import SensorTileSkeleton from "../components/dashboard/SensorTileSkeleton";
import SensorDetailPanel from "../components/dashboard/SensorDetailPanel";
import StatusBadge from "../components/dashboard/StatusBadge";
import RecommendationPanel from "../components/dashboard/RecommendationPanel";

// Fades and slides a block in. i = position in the sequence.
function Reveal({ i = 0, className = "", children }) {
  return (
    <div className={`reveal ${className}`} style={{ "--i": i }}>
      {children}
    </div>
  );
}

function SectionBar({ title }) {
  return (
    <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em]">
      <span className="text-accent">▸</span>
      {title}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export default function Dashboard() {
  const { live, trail, loading, connection, dataAge } = useData();
  const [selected, setSelected] = useState(null);

  const hasData = live?.status === "live";
  const sensors = hasData ? live.sensors : null;
  const statuses = hasData ? live.statuses : null;
  const prediction = hasData ? live.prediction : null;

  const isStale = connection === "stale";
  const dim = isStale ? "stale-dim" : "";

  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[500px]">
      <Reveal i={0}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              ◈ Airborne Disease Detection System
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-[11px] font-bold tracking-wider text-accent">
                CSE (AI &amp; ML)
              </span>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-[11px] font-bold tracking-wider text-accent">
                CSE (AI)
              </span>
              <span className="rounded-full border border-info/40 bg-info/10 px-3 py-0.5 text-[11px] font-bold tracking-wider text-info">
                IEDC
              </span>
            </div>
          </div>
          <div className="text-xs tracking-wider text-muted">FIREBASE RTDB · AUTO-REFRESH 5s</div>
        </div>
      </Reveal>

      <AlertBanner
        connection={connection}
        riskLevel={prediction?.risk_level}
        dataAge={dataAge}
      />

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-1">
        {/* ---------- main column ---------- */}
        <div className="flex flex-col gap-3 lg:col-span-9 lg:min-h-0">
          <div className="flex flex-col gap-2">
            <Reveal i={1}>
              <SectionBar title="Clinical Risk Assessment" />
            </Reveal>
            <div className="grid gap-3 md:grid-cols-2">
              <Reveal i={2} className={`flex [&>*]:flex-1 ${dim}`}>
                <RiskCard prediction={prediction} />
              </Reveal>
              <Reveal i={3} className={`flex [&>*]:flex-1 ${dim}`}>
                <DiseaseCard prediction={prediction} />
              </Reveal>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1">
            <Reveal i={4}>
              <SectionBar
                title={
                  <>
                    Sensor Readings
                    {isStale ? (
                      <span className="text-warn"> · no new data for {formatAge(dataAge)}</span>
                    ) : (
                      <span className="hidden sm:inline"> · click a tile for details</span>
                    )}
                  </>
                }
              />
            </Reveal>
            <div
              className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:min-h-0 lg:flex-1 lg:grid-rows-2"
              aria-busy={loading}
            >
              {loading
                ? SENSORS.map((def) => <SensorTileSkeleton key={def.id} />)
                : SENSORS.map((def, idx) => (
                    <Reveal key={def.id} i={5 + idx} className={`flex [&>*]:flex-1 ${dim}`}>
                      <SensorTile
                        label={def.label}
                        unit={def.unit}
                        digits={def.digits}
                        value={sensors ? Number(sensors[def.field]) : null}
                        status={def.status && statuses ? statuses[def.status] : "normal"}
                        trail={trail.map((p) => p[def.history])}
                        chart={def.chart}
                        stale={isStale}
                        onClick={() => setSelected(def)}
                      />
                    </Reveal>
                  ))}
            </div>
          </div>
        </div>

        {/* ---------- side column ---------- */}
        <aside className="flex flex-col gap-2 lg:col-span-3 lg:min-h-0">
          <Reveal i={1}>
            <SectionBar title="System" />
          </Reveal>
          <Reveal i={2}>
            <StatusBadge />
          </Reveal>
          <Reveal i={3} className="flex min-h-0 flex-1 flex-col [&>*]:min-h-0">
            <RecommendationPanel items={hasData ? live.recommendations : []} />
          </Reveal>
        </aside>
      </div>

      {selected && (
        <SensorDetailPanel sensor={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}