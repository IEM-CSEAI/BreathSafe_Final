export default function SensorTileSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="w-full rounded-[10px] border border-border bg-surface p-4"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-14" />
      </div>
      <div className="skeleton h-[30px] w-28" />
      <div className="skeleton mt-2 h-6 w-full" />
    </div>
  );
}