import type { TodaySummary } from "@/lib/types";

// Visual macro breakdown for today. Horizontal proportional bars, no
// hard targets — most users haven't set macro targets and the bible
// (§9) says no aggressive numbers. Three quiet bands instead.
export function MacroSummary({ summary }: { summary: TodaySummary }) {
  const p = Math.round(summary.total_protein_g);
  const c = Math.round(summary.total_carbs_g);
  const f = Math.round(summary.total_fat_g);
  const total = p + c + f;
  if (total === 0) return null;

  const pct = (n: number) => Math.max(2, Math.round((n / total) * 100));
  const pPct = pct(p);
  const cPct = pct(c);
  const fPct = 100 - pPct - cPct; // ensure they sum to 100

  return (
    <div className="rounded-xl2 bg-card p-4 ring-1 ring-sand">
      <div className="text-sm text-muted">Today's macros</div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        <div className="bg-sage" style={{ width: `${pPct}%` }} aria-label="protein" />
        <div className="bg-warmth" style={{ width: `${cPct}%` }} aria-label="carbs" />
        <div className="bg-sand" style={{ width: `${fPct}%` }} aria-label="fat" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Macro color="bg-sage" label="Protein" value={`${p}g`} />
        <Macro color="bg-warmth" label="Carbs" value={`${c}g`} />
        <Macro color="bg-sand" label="Fat" value={`${f}g`} />
      </div>
    </div>
  );
}

function Macro({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="text-muted">{label}</span>
      <span className="ml-auto text-ink">{value}</span>
    </div>
  );
}
