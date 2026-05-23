"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";

const OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Keep forever" },
  { value: 90, label: "After 90 days" },
  { value: 30, label: "After 30 days" },
  { value: 7, label: "After 7 days" },
];

export function PhotoRetentionCard() {
  const [value, setValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    api
      .getProfile(getDeviceId())
      .then((p) => setValue(p.photo_retention_days ?? null))
      .catch(() => {});
  }, []);

  async function choose(next: number | null) {
    setValue(next);
    setSaving(true);
    try {
      // Re-fetch then re-send to avoid clobbering the other profile fields.
      const current = await api.getProfile(getDeviceId()).catch(() => null);
      await api.upsertProfile({
        device_id: getDeviceId(),
        age: current?.age ?? null,
        weight_kg: current?.weight_kg ?? null,
        height_cm: current?.height_cm ?? null,
        goal: current?.goal ?? null,
        photo_retention_days: next,
      });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl2 bg-card p-4 ring-1 ring-sand">
      <div>
        <div className="text-sm text-muted">Photo retention</div>
        <div className="mt-0.5 text-base text-ink">
          {value == null ? "Keeping every photo" : `Auto-delete after ${value} days`}
        </div>
        <div className="mt-1 text-xs text-muted">
          Photos live on our server until you delete a meal or this sweep runs.
          Shorter retention favours privacy; longer keeps your meal history.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => choose(o.value)}
              disabled={saving}
              className={`rounded-xl2 px-3 py-2 text-sm ring-1 ${
                active ? "bg-sage/15 text-ink ring-sage" : "bg-card text-muted ring-sand"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {savedAt && Date.now() - savedAt < 4000 && (
        <p className="text-xs text-muted">Saved.</p>
      )}
    </div>
  );
}
