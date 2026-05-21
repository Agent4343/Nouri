import Link from "next/link";
import { api } from "@/lib/api";
import type { Meal } from "@/lib/types";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function MealCard({ meal }: { meal: Meal }) {
  const time = new Date(meal.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const photo = api.photoUrl(meal.photo_url);
  return (
    <Link
      href={`/correct/${meal.id}`}
      className="block rounded-xl2 bg-card shadow-sm ring-1 ring-sand transition hover:bg-card"
    >
      <div className="flex items-stretch gap-3 p-3">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={meal.label} className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-sand" />
        )}
        <div className="flex flex-1 items-start justify-between gap-3 py-1">
          <div>
            <div className="text-base font-medium text-ink">{meal.label}</div>
            <div className="mt-1 text-sm text-ink">
              {meal.calories} cal · {Math.round(meal.protein_g)}p / {Math.round(meal.carbs_g)}c / {Math.round(meal.fat_g)}f
            </div>
            <div className="mt-1 text-xs text-muted">{time}{meal.corrected ? " · corrected" : ""}</div>
          </div>
          {!meal.corrected && <ConfidenceBadge value={meal.confidence} />}
        </div>
      </div>
    </Link>
  );
}
