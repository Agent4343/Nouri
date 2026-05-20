"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getDeviceId, markOnboarded } from "@/lib/device";

// First 60 Seconds (Story Bible §8). Warm welcome, MVP profile, no shame.
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [goal, setGoal] = useState<string>("maintain");
  const [target, setTarget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const profile = await api.upsertProfile({
        device_id: getDeviceId(),
        age: age ? Number(age) : null,
        weight_kg: weight ? Number(weight) : null,
        height_cm: height ? Number(height) : null,
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
          <p className="mt-3 text-muted">
            This is a calmer way to track. No streaks, no shame, no perfect plan.
            You're tracking. That's the win.
          </p>
        </div>
        <button
          onClick={() => setStep(1)}
          className="rounded-xl2 bg-sage px-5 py-4 text-white shadow-sm hover:bg-sageDark"
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
        <Field label="Age (optional)">
          <input
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="input"
            placeholder="—"
          />
        </Field>
        <Field label="Weight, kg (optional)">
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="input"
            placeholder="—"
          />
        </Field>
        <Field label="Height, cm (optional)">
          <input
            inputMode="numeric"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="input"
            placeholder="—"
          />
        </Field>
        <Field label="Goal">
          <div className="flex gap-2">
            {(["lose", "maintain", "gain"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`flex-1 rounded-xl2 px-3 py-2 text-sm ring-1 ${
                  goal === g ? "bg-sage/15 text-ink ring-sage" : "bg-white/70 text-muted ring-sand"
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
          className="mt-2 rounded-xl2 bg-sage px-5 py-4 text-white shadow-sm hover:bg-sageDark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
        <style jsx>{`
          .input {
            width: 100%;
            border-radius: 1rem;
            background: rgba(255, 255, 255, 0.7);
            padding: 0.75rem 1rem;
            box-shadow: inset 0 0 0 1px #f1ebe0;
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
        <p className="mt-2 text-muted">
          {target
            ? `Here's a rough target: ~${target} cal a day. We'll adjust as we learn.`
            : "No target yet — that's fine. You can track without one."}
        </p>
      </div>
      <button onClick={finish} className="rounded-xl2 bg-sage px-5 py-4 text-white shadow-sm hover:bg-sageDark">
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
