import { MealCard } from "@/components/MealCard";
import type { Meal } from "@/lib/types";

type Group = "breakfast" | "lunch" | "dinner" | "snack" | "other";
const ORDER: Group[] = ["breakfast", "lunch", "dinner", "snack", "other"];
const TITLE: Record<Group, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  other: "Other",
};

// Infer meal type from logged time for older meals that don't have one stored.
function inferFromHour(iso: string): Group {
  const h = new Date(iso).getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  return "dinner";
}

export function MealsByType({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) return null;

  const buckets: Record<Group, Meal[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    other: [],
  };
  for (const m of meals) {
    const g = (m.meal_type as Group | null) ?? inferFromHour(m.logged_at);
    (buckets[g] ?? buckets.other).push(m);
  }

  return (
    <div className="flex flex-col gap-4">
      {ORDER.map((g) => {
        const list = buckets[g];
        if (list.length === 0) return null;
        const total = list.reduce((s, m) => s + m.calories, 0);
        return (
          <section key={g} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between px-1">
              <h3 className="text-sm font-medium text-ink">{TITLE[g]}</h3>
              <span className="text-xs text-muted">{total} cal</span>
            </div>
            <div className="flex flex-col gap-2">
              {list.map((m) => (
                <MealCard key={m.id} meal={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
