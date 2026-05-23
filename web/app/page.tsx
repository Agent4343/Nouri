"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getDeviceId, hasOnboarded } from "@/lib/device";
import { DailyTotal } from "@/components/DailyTotal";
import { MacroSummary } from "@/components/MacroSummary";
import { MealsByType } from "@/components/MealsByType";
import { UsualMealCard } from "@/components/UsualMealCard";
import { WeeklyChart } from "@/components/WeeklyChart";
import { WeightSummary } from "@/components/WeightSummary";
import type { TodaySummary } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [relogging, setRelogging] = useState<string | null>(null);

  async function reload() {
    const deviceId = getDeviceId();
    try {
      setSummary(await api.today(deviceId));
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    if (!hasOnboarded()) {
      router.replace("/onboarding");
      return;
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function repeat(sourceMealId: string) {
    setRelogging(sourceMealId);
    try {
      await api.repeatMeal({ device_id: getDeviceId(), source_meal_id: sourceMealId });
      await reload();
    } finally {
      setRelogging(null);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl2 bg-card p-5 ring-1 ring-sand text-sm text-ink">
        Couldn't reach the server. We'll try again next time.
      </div>
    );
  }

  if (!summary) {
    return <div className="text-sm text-muted">Loading today…</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <DailyTotal summary={summary} />

      <MacroSummary summary={summary} />

      <Link
        href="/snap"
        className="block rounded-xl2 bg-sage px-5 py-4 text-center text-cream shadow-sm transition hover:bg-sageDark"
      >
        Snap a meal
      </Link>

      <UsualMealCard onLogged={reload} />

      {summary.yesterday.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted">Had this yesterday?</div>
          <div className="flex flex-wrap gap-2">
            {summary.yesterday.map((y) => (
              <button
                key={y.source_meal_id}
                onClick={() => repeat(y.source_meal_id)}
                disabled={relogging !== null}
                className="rounded-full bg-card px-3 py-1.5 text-sm text-ink ring-1 ring-sand hover:bg-cream disabled:opacity-60"
              >
                {relogging === y.source_meal_id ? "Logging…" : `${y.label} · ${y.calories} cal`}
              </button>
            ))}
          </div>
        </div>
      )}

      {summary.meals.length === 0 ? (
        <Link
          href="/snap"
          className="block rounded-xl2 bg-card p-5 text-center ring-1 ring-sand hover:bg-card"
        >
          <div className="text-ink">Nothing logged yet today.</div>
          <div className="mt-1 text-sm text-muted">
            Tap to snap your first meal — even a rough estimate counts.
          </div>
        </Link>
      ) : (
        <MealsByType meals={summary.meals} />
      )}

      <WeightSummary />

      <WeeklyChart week={summary.week} target={summary.target_calories} />
    </div>
  );
}
