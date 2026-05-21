"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";

export default function SnapPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [hint, setHint] = useState("");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(file: File) {
    setErr(null);
    setUploading(true);
    // Local preview while the upload is in flight.
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    try {
      const up = await api.uploadPhoto(file);
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

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Hint (optional)</span>
        <input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="e.g. chicken bowl"
          className="rounded-xl2 bg-card px-4 py-3 ring-1 ring-sand outline-none"
        />
      </label>

      <button
        onClick={logIt}
        disabled={logging || uploading}
        className="rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
      >
        {uploading ? "Uploading…" : logging ? "Estimating…" : photoId ? "Log it" : "Log without photo"}
      </button>

      {err && <p className="text-sm text-ink">{err}</p>}
    </section>
  );
}
