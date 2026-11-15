import { useId } from "react";

const H = 32;
const PAD = 4;

function smoothPath(pts) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = ((x0 + x1) / 2).toFixed(1);
    d += ` C${cx},${y0.toFixed(1)} ${cx},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

export default function Sparkline({
  values = [],
  color = "accent",
  className = "h-full w-full",
}) {
  const uid = useId().replace(/:/g, "");
  const clean = values.filter((v) => typeof v === "number" && !Number.isNaN(v));

  if (clean.length < 2) return <div className={className} />;

  const lo = Math.min(...clean);
  const hi = Math.max(...clean);
  const span = hi - lo;

  const pts = clean.map((v, i) => [
    (i / (clean.length - 1)) * 100,
    span === 0 ? H / 2 : H - PAD - ((v - lo) / span) * (H - 2 * PAD),
  ]);

  const line = smoothPath(pts);
  const area = `${line} L100,${H} L0,${H} Z`;
  const c = `rgb(var(--${color}))`;

  return (
    <svg
      viewBox={`0 0 100 ${H}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: c, stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: c, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${uid})`} />
      <path
        d={line}
        fill="none"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}