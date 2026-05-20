"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getDeviceId, markOnboarded } from "@/lib/device";
import { getUnits, setUnits, lbToKg, ftInToCm, type Units } from "@/lib/units";

// First 60 Seconds (Story Bible §8). Warm welcome, MVP profile, no shame.
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [units, setUnitsState] = useState<Units>("metric");
  const [age, setAge] = useState("");
  // Metric inputs
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  // Imperial inputs
  const [weightLb, setWeightLb] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");

  const [goal, setGoal] = useState("maintain");
  const [target, setTarget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUnitsState(getUnits());
  }, []);

  function chooseUnits(u: Units) {
    setUnitsState(u);
    setUnits(u);
  }

  async function save() {
    setSaving(true);
    try {
      const weight_kg =
        units === "metric"
          ? weightKg ? Number(weightKg) : null
          : weightLb ? lbToKg(Number(weightLb)) : null;

      const height_cm =
        units === "metric"
          ? heightCm ? Number(heightCm) : null
          : (heightFt || heightIn)
              ? ftInToCm(Number(heightFt || 0), Number(heightIn || 0))
              : null;

      const profile = await api.upsertProfile({
        device_id: getDeviceId(),
        age: age ? Number(age) : null,
        weight_kg,
        height_cm,
        goal,
      });
      setTarget(profile.calorie_target);
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  function finish() {
    markOnboarded();
    router.replace("/snap");
  }

  if (step === 0) {
    return (
      <section className="flex flex-col gap-6 pt-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Welcome.</h1>
          <p className="mt-3 text-ink">
            This is a calmer way to track. No streaks, no shame, no perfect plan.
            You're tracking. That's the win.
          </p>
        </div>
        <button
          onClick={() => setStep(1)}
          className="rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark"
        >
          Let's start
        </button>
        <button
          onClick={() => {
            markOnboarded();
            router.replace("/snap");
          }}
          className="text-sm text-muted underline-offset-4 hover:underline"
        >
          Skip and just try it
        </button>
      </section>
    );
  }

  if (step === 1) {
    return (
      <section className="flex flex-col gap-5 pt-2">
        <div>
          <h2 className="text-xl font-medium">A few light details</h2>
          <p className="mt-1 text-sm text-muted">Every field is optional. Skip what you don't want to share.</p>
        </div>

        <div className="flex gap-2">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              onClick={() => chooseUnits(u)}
              className={`flex-1 rounded-xl2 px-3 py-2 text-sm ring-1 ${
                units === u ? "bg-sage/15 text-ink ring-sage" : "bg-card text-muted ring-sand"
              }`}
            >
              {u === "metric" ? "Metric (kg · cm)" : "Imperial (lb · ft/in)"}
            </button>
          ))}
        </div>

        <Field label="Age (optional)">
          <input
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="input"
            placeholder="—"
          />
        </Field>

        {units === "metric" ? (
          <>
            <Field label="Weight, kg (optional)">
              <input
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="input"
                placeholder="—"
              />
            </Field>
            <Field label="Height, cm (optional)">
              <input
                inputMode="numeric"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="input"
                placeholder="—"
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Weight, lb (optional)">
              <input
                inputMode="decimal"
                value={weightLb}
                onChange={(e) => setWeightLb(e.target.value)}
                className="input"
                placeholder="—"
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-muted">Height (optional)</span>
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  className="input"
                  placeholder="ft"
                />
                <input
                  inputMode="numeric"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  className="input"
                  placeholder="in"
                />
              </div>
            </div>
          </>
        )}

        <Field label="Goal">
          <div className="flex gap-2">
            {(["lose", "maintain", "gain"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`flex-1 rounded-xl2 px-3 py-2 text-sm ring-1 ${
                  goal === g ? "bg-sage/15 text-ink ring-sage" : "bg-card text-muted ring-sand"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>

        <button
          onClick={save}
          disabled={saving}
          className="mt-2 rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
        <style jsx>{`
          .input {
            width: 100%;
            border-radius: 1rem;
            background: #1A1714;
            padding: 0.75rem 1rem;
            color: #F5EFE5;
            box-shadow: inset 0 0 0 1px #3A322B;
            outline: none;
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 pt-6">
      <div>
        <h2 className="text-xl font-medium">A rough number to start</h2>
        <p className="mt-2 text-ink">
          {target
            ? `Here's a rough target: ~${target} cal a day. We'll adjust as we learn.`
            : "No target yet — that's fine. You can track without one."}
        </p>
      </div>
      <button onClick={finish} className="rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark">
        Snap your first meal
      </button>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
