import Link from "next/link";
import type { Meal } from "@/lib/types";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function MealCard({ meal }: { meal: Meal }) {
  const time = new Date(meal.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <Link
      href={`/correct/${meal.id}`}
      className="block rounded-xl2 bg-white px-4 py-4 shadow-sm ring-1 ring-sand transition hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-medium text-ink">{meal.label}</div>
          <div className="mt-1 text-sm text-ink">
            {meal.calories} cal · {Math.round(meal.protein_g)}p / {Math.round(meal.carbs_g)}c / {Math.round(meal.fat_g)}f
          </div>
          <div className="mt-1 text-xs text-muted">{time}{meal.corrected ? " · corrected" : ""}</div>
        </div>
        {!meal.corrected && <ConfidenceBadge value={meal.confidence} />}
      </div>
    </Link>
  );
}
