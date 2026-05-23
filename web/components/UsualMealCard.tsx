"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";

type Suggestion = { source_meal_id: string; label: string; calories: number };

const TITLES: Record<string, string> = {
  breakfast: "Usual breakfast?",
  lunch: "Usual lunch?",
  dinner: "Usual dinner?",
  snack: "Usual snack?",
};

function currentMealType(): string {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  return "dinner";
}

export function UsualMealCard({ onLogged }: { onLogged: () => void }) {
  const [meal, setMeal] = useState<Suggestion | null>(null);
  const [working, setWorking] = useState(false);
  const mealType = currentMealType();

  useEffect(() => {
    api
      .mealSuggestion(getDeviceId(), mealType)
      .then((s) => setMeal(s))
      .catch(() => setMeal(null));
  }, [mealType]);

  async function logIt() {
    if (!meal) return;
    setWorking(true);
    try {
      await api.repeatMeal({ device_id: getDeviceId(), source_meal_id: meal.source_meal_id });
      onLogged();
    } finally {
      setWorking(false);
    }
  }

  if (!meal) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl2 bg-card p-4 ring-1 ring-sand">
      <div className="min-w-0">
        <div className="text-sm text-muted">{TITLES[mealType] ?? "Usual?"}</div>
        <div className="mt-0.5 truncate text-base text-ink">
          {meal.label} · {meal.calories} cal
        </div>
      </div>
      <button
        onClick={logIt}
        disabled={working}
        className="shrink-0 rounded-full bg-sage px-4 py-2 text-sm text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
      >
        {working ? "…" : "Log"}
      </button>
    </div>
  );
}
