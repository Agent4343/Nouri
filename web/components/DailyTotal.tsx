import type { TodaySummary } from "@/lib/types";

export function DailyTotal({ summary }: { summary: TodaySummary }) {
  const { total_calories, target_calories, message } = summary;
  const pct = target_calories ? Math.min(100, Math.round((total_calories / target_calories) * 100)) : 0;
  const remaining = target_calories ? target_calories - total_calories : null;

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
        {remaining != null && (
          <div className="text-right">
            <div className="text-xs text-muted">
              {remaining > 0 ? "remaining" : remaining === 0 ? "at target" : "over"}
            </div>
            <div className="text-lg font-medium text-ink">
              {remaining > 0 ? remaining : remaining < 0 ? Math.abs(remaining) : "—"}
            </div>
          </div>
        )}
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
