import type { WeeklyDayTotal } from "@/lib/types";

// Calm 7-day bar chart (Story Bible §9: no aggressive numbers, no progress
// anxiety). Inline SVG, no library. Target line shown only when one exists
// so users without a target see just the bars.
export function WeeklyChart({
  week,
  target,
}: {
  week: WeeklyDayTotal[];
  target: number | null;
}) {
  const max = Math.max(target ?? 0, ...week.map((d) => d.calories), 1500);
  const W = 280;
  const H = 88;
  const padX = 4;
  const padY = 8;
  const gap = 6;
  const colW = (W - padX * 2 - gap * (week.length - 1)) / week.length;
  const innerH = H - padY * 2;

  const todayIdx = week.length - 1;
  const targetY = target ? padY + innerH - (target / max) * innerH : null;

  return (
    <div className="rounded-xl2 bg-card p-4 ring-1 ring-sand">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-sm text-muted">Last 7 days</div>
        {target && <div className="text-xs text-muted">target ~{target}</div>}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Calories over the last 7 days"
        className="block w-full"
      >
        {targetY != null && (
          <line
            x1={padX}
            x2={W - padX}
            y1={targetY}
            y2={targetY}
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeDasharray="3 3"
            className="text-muted"
          />
        )}
        {week.map((d, i) => {
          const h = d.calories > 0 ? Math.max(2, (d.calories / max) * innerH) : 2;
          const x = padX + i * (colW + gap);
          const y = padY + innerH - h;
          const isToday = i === todayIdx;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={colW}
                height={h}
                rx={3}
                className={isToday ? "fill-sage" : "fill-sand"}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted">
        {week.map((d) => (
          <span key={d.date} className="w-8 text-center">
            {dayLabel(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

function dayLabel(iso: string): string {
  // iso is YYYY-MM-DD UTC. Build a Date so we render the user's local weekday letter.
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, day ?? 1);
  return d.toLocaleDateString(undefined, { weekday: "narrow" });
}
