"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import type { BarcodeProduct } from "@/lib/types";

// Native BarcodeDetector where available (Chrome on Android, Safari iOS ≥16.4),
// falls back to typed entry otherwise (desktop Safari, Firefox, older browsers).
// No heavyweight ZXing dependency until V2 proves the demand.

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

declare global {
  interface Window {
    BarcodeDetector?: { new (opts?: { formats?: string[] }): Detector };
  }
}

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRef = useRef<{ stopped: boolean }>({ stopped: false });

  const [supportsCamera, setSupportsCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [servings, setServings] = useState("1");
  const [grams, setGrams] = useState("100");
  const [looking, setLooking] = useState(false);
  const [logging, setLogging] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setSupportsCamera(typeof window !== "undefined" && "BarcodeDetector" in window);
    return () => stopScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopScan() {
    stopRef.current.stopped = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    if (!window.BarcodeDetector) {
      setErr("Camera scanning isn't supported here. Type the barcode below.");
      return;
    }
    setErr(null);
    setScanning(true);
    stopRef.current = { stopped: false };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new window.BarcodeDetector();
      const tick = async () => {
        if (stopRef.current.stopped || !videoRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          if (results.length > 0) {
            const value = results[0].rawValue;
            stopScan();
            setCode(value);
            await lookupCode(value);
            return;
          }
        } catch {
          // ignore transient decode errors
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setErr("Couldn't access the camera. Type the barcode below.");
      setScanning(false);
    }
  }

  async function lookupCode(value: string) {
    if (!value) return;
    setLooking(true);
    setErr(null);
    setProduct(null);
    try {
      const p = await api.lookupBarcode(value);
      setProduct(p);
      if (p.per === "serving") setServings("1");
      else setGrams(p.serving_size_g ? String(Math.round(p.serving_size_g)) : "100");
    } catch (e: unknown) {
      setErr("Product not found. You can still log it by snapping a photo or typing it in.");
    } finally {
      setLooking(false);
    }
  }

  function multiplier(): number {
    if (!product) return 1;
    if (product.per === "serving") return Math.max(0, Number(servings) || 1);
    return Math.max(0, Number(grams) || 0) / 100;
  }

  const m = multiplier();
  const previewCal = product ? Math.round(product.calories * m) : 0;

  async function log() {
    if (!product) return;
    setLogging(true);
    try {
      const label = product.brand ? `${product.label} (${product.brand})` : product.label;
      await api.logManual({
        device_id: getDeviceId(),
        label,
        calories: previewCal,
        protein_g: Math.round(product.protein_g * m * 10) / 10,
        carbs_g: Math.round(product.carbs_g * m * 10) / 10,
        fat_g: Math.round(product.fat_g * m * 10) / 10,
        source: "barcode",
      });
      router.replace("/");
    } finally {
      setLogging(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 pt-2">
      <div>
        <h2 className="text-xl font-medium">Scan a barcode</h2>
        <p className="mt-1 text-sm text-ink">Best for packaged foods. We use Open Food Facts.</p>
      </div>

      {scanning ? (
        <div className="overflow-hidden rounded-xl2 ring-1 ring-sand">
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/media-has-caption */}
          <video ref={videoRef} playsInline muted className="block h-64 w-full object-cover" />
          <button
            onClick={stopScan}
            className="block w-full bg-card px-4 py-3 text-sm text-ink ring-1 ring-sand"
          >
            Cancel scan
          </button>
        </div>
      ) : (
        supportsCamera && (
          <button
            onClick={startScan}
            className="rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark"
          >
            Open camera
          </button>
        )
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Or type the barcode</span>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 5000159484695"
            className="flex-1 rounded-xl2 bg-card px-4 py-3 ring-1 ring-sand outline-none"
          />
          <button
            onClick={() => lookupCode(code)}
            disabled={looking || !code}
            className="rounded-xl2 bg-card px-4 py-3 text-sm text-ink ring-1 ring-sand disabled:opacity-60"
          >
            {looking ? "Looking…" : "Look up"}
          </button>
        </div>
      </label>

      {err && <p className="text-sm text-ink">{err}</p>}

      {product && (
        <div className="flex flex-col gap-3 rounded-xl2 bg-card p-4 ring-1 ring-sand">
          <div>
            <div className="text-base text-ink">{product.label}</div>
            {product.brand && <div className="text-sm text-muted">{product.brand}</div>}
          </div>

          {product.per === "serving" ? (
            <label className="flex items-center gap-2 text-sm text-muted">
              Servings
              <input
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                inputMode="decimal"
                className="w-20 rounded-lg bg-cream px-2 py-1 ring-1 ring-sand outline-none"
              />
              {product.serving_size_g && (
                <span className="text-xs text-muted">({Math.round(product.serving_size_g)} g each)</span>
              )}
            </label>
          ) : (
            <label className="flex items-center gap-2 text-sm text-muted">
              Grams eaten
              <input
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                inputMode="numeric"
                className="w-24 rounded-lg bg-cream px-2 py-1 ring-1 ring-sand outline-none"
              />
            </label>
          )}

          <div className="text-sm text-ink">
            ~{previewCal} cal · {Math.round(product.protein_g * m)}p / {Math.round(product.carbs_g * m)}c / {Math.round(product.fat_g * m)}f
          </div>

          <button
            onClick={log}
            disabled={logging || previewCal <= 0}
            className="rounded-xl2 bg-sage px-5 py-3 text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
          >
            {logging ? "Logging…" : "Log it"}
          </button>
        </div>
      )}
    </section>
  );
}
