"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { track } from "@/lib/track";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import type { Meal } from "@/lib/types";

// Quick Correct (§16) + Low-Confidence Fallback (§15). One tap to fix.
export default function CorrectPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [label, setLabel] = useState("");
  const [calories, setCalories] = useState("");
  const [portion, setPortion] = useState(1);
  const [saving, setSaving] = useState(false);

  function applyPortion(factor: number) {
    setPortion(factor);
    if (!meal) return;
    setCalories(String(Math.round(meal.calories * factor)));
  }

  useEffect(() => {
    // The freshly-logged meal flow lands here from /snap, so we re-fetch today.
    const deviceId = getDeviceId();
    api.today(deviceId).then((s) => {
      const m = s.meals.find((x) => x.id === params.id);
      if (m) {
        setMeal(m);
        setLabel(m.label);
        setCalories(String(m.calories));
      }
    });
  }, [params.id]);

  async function save() {
    if (!meal) return;
    setSaving(true);
    try {
      await api.correct(meal.id, {
        label: label !== meal.label ? label : undefined,
        calories: Number(calories) !== meal.calories ? Number(calories) : undefined,
      });
      track("meal_corrected", { via: "form", portion });
      router.replace("/");
    } finally {
      setSaving(false);
    }
  }

  async function pickAlternative(alt: { label: string; calories: number }) {
    if (!meal) return;
    setSaving(true);
    try {
      await api.correct(meal.id, { label: alt.label, calories: alt.calories });
      track("meal_corrected", { via: "alternative" });
      router.replace("/");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!meal) return;
    if (!confirm("Remove this meal from today?")) return;
    setSaving(true);
    try {
      await api.deleteMeal(meal.id);
      track("meal_deleted");
      router.replace("/");
    } finally {
      setSaving(false);
    }
  }

  if (!meal) return <div className="text-sm text-muted">Loading…</div>;

  const fresh = search.get("fresh") === "1";
  const lowConfidence = meal.confidence < 0.65 && !meal.corrected;
  const photo = api.photoUrl(meal.photo_url);

  return (
    <section className="flex flex-col gap-5 pt-2">
      {photo && (
        <div className="overflow-hidden rounded-xl2 ring-1 ring-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={meal.label} className="block h-56 w-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-medium">{fresh ? "Looks like…" : "Edit meal"}</h2>
          <p className="mt-1 text-sm text-ink">
            {lowConfidence
              ? "We're not confident on this one yet. Pick a closer match or fix it below."
              : "Anything off? One tap away."}
          </p>
        </div>
        {!meal.corrected && <ConfidenceBadge value={meal.confidence} />}
      </div>

      {lowConfidence && meal.alternatives && meal.alternatives.length > 0 && (
        <div className="flex flex-col gap-2">
          {meal.alternatives.map((alt) => (
            <button
              key={alt.label}
              onClick={() => pickAlternative(alt)}
              className="rounded-xl2 bg-card px-4 py-3 text-left ring-1 ring-sand hover:bg-card"
            >
              <div className="text-ink">{alt.label}</div>
              <div className="text-sm text-ink">{alt.calories} cal</div>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Portion</span>
        <div className="grid grid-cols-4 gap-2">
          {[0.5, 1, 1.5, 2].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => applyPortion(f)}
              className={`rounded-xl2 px-3 py-2 text-sm ring-1 ${
                portion === f ? "bg-sage/15 text-ink ring-sage" : "bg-card text-muted ring-sand"
              }`}
            >
              {f === 0.5 ? "½×" : f === 1 ? "1×" : `${f}×`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl2 bg-card p-4 ring-1 ring-sand">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">What was it?</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg bg-cream px-3 py-2 ring-1 ring-sand outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Calories</span>
          <input
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="rounded-lg bg-cream px-3 py-2 ring-1 ring-sand outline-none"
          />
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.replace("/")}
          className="flex-1 rounded-xl2 bg-card px-5 py-4 ring-1 ring-sand hover:bg-card"
        >
          Looks right
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save fix"}
        </button>
      </div>

      <button
        onClick={remove}
        disabled={saving}
        className="self-center text-sm text-muted underline-offset-4 hover:underline disabled:opacity-60"
      >
        Remove this meal
      </button>
    </section>
  );
}
