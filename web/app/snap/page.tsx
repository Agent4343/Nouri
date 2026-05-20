"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";

// Snap flow. Real photo upload comes later; for V1 we send a hint string
// to the mock vision layer so the rest of the loop is testable.
export default function SnapPage() {
  const router = useRouter();
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function snap() {
    setLoading(true);
    setErr(null);
    try {
      const meal = await api.snap({
        device_id: getDeviceId(),
        hint: hint || undefined,
        photo_url: undefined,
      });
      router.replace(`/correct/${meal.id}?fresh=1`);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 pt-2">
      <div>
        <h2 className="text-xl font-medium">Snap a meal</h2>
        <p className="mt-1 text-sm text-ink">
          Real camera upload comes next. For now, give it a hint — or just tap to log a quick estimate.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">What is it? (optional)</span>
        <input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="e.g. chicken bowl"
          className="rounded-xl2 bg-white px-4 py-3 ring-1 ring-sand outline-none"
        />
      </label>

      <button
        onClick={snap}
        disabled={loading}
        className="rounded-xl2 bg-sage px-5 py-4 text-white shadow-sm hover:bg-sageDark disabled:opacity-60"
      >
        {loading ? "Estimating…" : "Log it"}
      </button>

      {err && (
        <p className="text-sm text-ink">Couldn't reach the server. Try again in a moment.</p>
      )}
    </section>
  );
}
