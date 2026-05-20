// Honesty surface for §3 + §7: confidence is always visible, never faked.
export function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.8 ? "bg-sage/20 text-sageDark" : value >= 0.65 ? "bg-warmth/25 text-ink" : "bg-sand text-ink";
  const label = value >= 0.8 ? "Confident" : value >= 0.65 ? "Best guess" : "Not sure yet";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${tone}`}>
      <span className="font-medium">{label}</span>
      <span className="opacity-70">{pct}%</span>
    </span>
  );
}
