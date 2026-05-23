"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getDeviceId, hasOnboarded } from "@/lib/device";
import { DailyTotal } from "@/components/DailyTotal";
import { MealCard } from "@/components/MealCard";
import { WeeklyChart } from "@/components/WeeklyChart";
import type { TodaySummary } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasOnboarded()) {
      router.replace("/onboarding");
      return;
    }
    const deviceId = getDeviceId();
    api.today(deviceId).then(setSummary).catch((e) => setError(String(e)));
  }, [router]);

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

      <Link
        href="/snap"
        className="block rounded-xl2 bg-sage px-5 py-4 text-center text-cream shadow-sm transition hover:bg-sageDark"
      >
        Snap a meal
      </Link>

      {summary.meals.length === 0 ? (
        <div className="rounded-xl2 bg-card p-5 text-sm text-ink ring-1 ring-sand">
          Nothing logged yet. Whenever you're ready.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {summary.meals.map((m) => (
            <MealCard key={m.id} meal={m} />
          ))}
        </div>
      )}

      <WeeklyChart week={summary.week} target={summary.target_calories} />
    </div>
  );
}
