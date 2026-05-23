"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { compressImage } from "@/lib/imageCompress";
import { track } from "@/lib/track";

type RecentChip = { source_meal_id: string; label: string; calories: number };

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

type WhenPreset = "now" | "1h" | "earlier" | "yesterday";

function defaultMealType(): MealType {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  return "dinner";
}

function resolveWhen(preset: WhenPreset, customISO: string): string | undefined {
  if (preset === "now") return undefined; // backend defaults to now
  const now = new Date();
  if (preset === "1h") return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  if (preset === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    d.setHours(12, 0, 0, 0); // noon yesterday is a reasonable anchor
    return d.toISOString();
  }
  // "earlier" — custom datetime-local value (browser-local) → ISO
  if (!customISO) return undefined;
  return new Date(customISO).toISOString();
}

export default function SnapPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [hint, setHint] = useState("");
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [when, setWhen] = useState<WhenPreset>("now");
  const [customWhen, setCustomWhen] = useState<string>("");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentChip[]>([]);
  const [relogging, setRelogging] = useState<string | null>(null);

  useEffect(() => {
    api
      .recentMeals(getDeviceId(), 14, 6)
      .then(setRecents)
      .catch(() => setRecents([]));
  }, []);

  async function logRecent(sourceId: string) {
    setRelogging(sourceId);
    try {
      await api.repeatMeal({ device_id: getDeviceId(), source_meal_id: sourceId });
      router.replace("/");
    } finally {
      setRelogging(null);
    }
  }

  async function onFile(file: File) {
    setErr(null);
    setUploading(true);
    // Local preview while compression + upload are in flight.
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    try {
      const compressed = await compressImage(file);
      const up = await api.uploadPhoto(compressed);
      setPhotoId(up.photo_id);
    } catch (e) {
      setErr("Upload failed. Try again in a moment.");
      setPhotoId(null);
      URL.revokeObjectURL(localUrl);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  async function logIt() {
    setLogging(true);
    setErr(null);
    try {
      const meal = await api.snap({
        device_id: getDeviceId(),
        photo_id: photoId ?? undefined,
        hint: hint || undefined,
        meal_type: mealType,
        logged_at: resolveWhen(when, customWhen),
      });
      track("meal_logged", {
        source: photoId ? "photo" : "manual",
        meal_type: mealType,
        confidence: meal.confidence,
        backfilled: when !== "now",
      });
      router.replace(`/correct/${meal.id}?fresh=1`);
    } catch (e) {
      setErr("Couldn't reach the server. Try again in a moment.");
    } finally {
      setLogging(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 pt-2">
      <div>
        <h2 className="text-xl font-medium">Snap a meal</h2>
        <p className="mt-1 text-sm text-ink">
          Take a photo (or pick one) and we'll estimate it. Add a hint if it helps.
        </p>
      </div>

      {recents.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">Recently logged · one-tap</span>
          <div className="flex flex-wrap gap-2">
            {recents.map((r) => (
              <button
                key={r.source_meal_id}
                type="button"
                onClick={() => logRecent(r.source_meal_id)}
                disabled={relogging !== null}
                className="rounded-full bg-card px-3 py-1.5 text-sm text-ink ring-1 ring-sand hover:bg-cream disabled:opacity-60"
              >
                {relogging === r.source_meal_id ? "Logging…" : `${r.label} · ${r.calories} cal`}
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl2 ring-1 ring-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Meal preview" className="block h-64 w-full object-cover" />
        </div>
      ) : (
        <button
          onClick={() => fileInput.current?.click()}
          className="flex h-48 items-center justify-center rounded-xl2 bg-card text-sm text-ink ring-1 ring-sand hover:bg-card"
        >
          Tap to take or choose a photo
        </button>
      )}

      {previewUrl && (
        <div className="flex gap-3">
          <button
            onClick={() => {
              setPhotoId(null);
              setPreviewUrl(null);
              if (fileInput.current) fileInput.current.value = "";
            }}
            className="flex-1 rounded-xl2 bg-card px-5 py-3 text-sm ring-1 ring-sand"
          >
            Retake
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">When was this?</span>
        <div className="grid grid-cols-4 gap-2">
          {(["now", "1h", "earlier", "yesterday"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWhen(w)}
              className={`rounded-xl2 px-2 py-2 text-xs ring-1 ${
                when === w ? "bg-sage/15 text-ink ring-sage" : "bg-card text-muted ring-sand"
              }`}
            >
              {w === "now" ? "Now" : w === "1h" ? "1h ago" : w === "earlier" ? "Earlier" : "Yesterday"}
            </button>
          ))}
        </div>
        {when === "earlier" && (
          <input
            type="datetime-local"
            value={customWhen}
            onChange={(e) => setCustomWhen(e.target.value)}
            className="rounded-xl2 bg-card px-4 py-2 text-sm text-ink ring-1 ring-sand outline-none"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">What kind of meal?</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MEAL_TYPES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMealType(m)}
              className={`rounded-xl2 px-3 py-3 text-sm capitalize ring-1 ${
                mealType === m ? "bg-sage/15 text-ink ring-sage" : "bg-card text-muted ring-sand"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <details className="rounded-xl2 bg-card ring-1 ring-sand">
        <summary className="cursor-pointer px-4 py-3 text-sm text-muted">
          Add a detail (optional)
        </summary>
        <input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="e.g. chicken bowl, oat milk latte"
          className="block w-full bg-transparent px-4 pb-3 text-ink outline-none"
        />
      </details>

      <button
        onClick={logIt}
        disabled={logging || uploading}
        className="rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
      >
        {uploading ? "Uploading…" : logging ? "Estimating…" : photoId ? "Log it" : "Log without photo"}
      </button>

      {err && <p className="text-sm text-ink">{err}</p>}

      <Link
        href="/scan"
        className="self-center text-sm text-muted underline-offset-4 hover:underline"
      >
        Or scan a barcode
      </Link>
    </section>
  );
}
