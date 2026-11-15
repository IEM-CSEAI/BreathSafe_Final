export default function AnalyticsCard({ title, subtitle, right, children, className = "" }) {
  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface p-3 shadow-xs ${className}`}
    >
      <header className="mb-1.5 flex shrink-0 items-center justify-between gap-2 border-b border-border/40 pb-1.5">
        <div className="min-w-0">
          <h2 className="truncate text-xs font-bold uppercase tracking-wider text-fg">
            {title}
          </h2>
          {subtitle && (
            <p className="truncate text-[11px] font-medium text-muted">
              {subtitle}
            </p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </header>
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {children}
      </div>
    </section>
  );
}