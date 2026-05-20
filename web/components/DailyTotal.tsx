import type { TodaySummary } from "@/lib/types";

export function DailyTotal({ summary }: { summary: TodaySummary }) {
  const { total_calories, target_calories, message } = summary;
  // No red. No alarm bars. Soft fill, capped at 100% visually (§9).
  const pct = target_calories ? Math.min(100, Math.round((total_calories / target_calories) * 100)) : 0;
  return (
    <section className="rounded-xl2 bg-card p-5 shadow-sm ring-1 ring-sand">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-muted">Today</div>
          <div className="mt-1 text-3xl font-medium tracking-tight">
            {total_calories}
            <span className="ml-1 text-base font-normal text-muted">
              {target_calories ? `of ~${target_calories} cal` : "cal"}
            </span>
          </div>
        </div>
      </div>
      {target_calories && (
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sand">
          <div className="h-full rounded-full bg-sage transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="mt-4 text-sm text-ink">{message}</p>
    </section>
  );
}
