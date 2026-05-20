"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import type { SavedMeal } from "@/lib/types";

export default function SavedPage() {
  const router = useRouter();
  const [items, setItems] = useState<SavedMeal[] | null>(null);
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const list = await api.listSaved(getDeviceId());
    setItems(list);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create() {
    if (!name || !cal) return;
    setSaving(true);
    try {
      await api.createSaved({
        device_id: getDeviceId(),
        name,
        calories: Number(cal),
      });
      setName("");
      setCal("");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function logAgain(id: string) {
    await api.logFromSaved({ device_id: getDeviceId(), saved_meal_id: id });
    router.replace("/");
  }

  return (
    <section className="flex flex-col gap-5 pt-2">
      <div>
        <h2 className="text-xl font-medium">Saved meals</h2>
        <p className="mt-1 text-sm text-muted">One tap to log a regular.</p>
      </div>

      {items === null ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl2 bg-white/70 p-5 text-sm text-muted ring-1 ring-sand">
          No saved meals yet. Add one below.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl2 bg-white/80 px-4 py-3 ring-1 ring-sand">
              <div>
                <div className="text-ink">{s.name}</div>
                <div className="text-sm text-muted">{s.calories} cal</div>
              </div>
              <button
                onClick={() => logAgain(s.id)}
                className="rounded-full bg-sage/15 px-3 py-1.5 text-sm text-sageDark hover:bg-sage/25"
              >
                Log again
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl2 bg-white/80 p-4 ring-1 ring-sand">
        <div className="text-sm text-muted">Add a saved meal</div>
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. usual breakfast)"
            className="rounded-lg bg-cream px-3 py-2 ring-1 ring-sand outline-none"
          />
          <input
            value={cal}
            onChange={(e) => setCal(e.target.value)}
            placeholder="Calories"
            inputMode="numeric"
            className="rounded-lg bg-cream px-3 py-2 ring-1 ring-sand outline-none"
          />
          <button
            onClick={create}
            disabled={saving || !name || !cal}
            className="mt-1 rounded-xl2 bg-sage px-5 py-3 text-white shadow-sm hover:bg-sageDark disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </section>
  );
}
