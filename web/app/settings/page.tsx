"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { getUnits, setUnits, lbToKg, ftInToCm, type Units } from "@/lib/units";
import { WeightLog } from "@/components/WeightLog";
import type { Profile } from "@/lib/types";

function kgToLbStr(kg: number | null | undefined): string {
  if (kg == null) return "";
  return (kg / 0.45359237).toFixed(1);
}

function cmToFtIn(cm: number | null | undefined): { ft: string; inch: string } {
  if (cm == null) return { ft: "", inch: "" };
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return { ft: String(ft), inch: String(inch) };
}

export default function SettingsPage() {
  const router = useRouter();
  const [units, setUnitsState] = useState<Units>("metric");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [goal, setGoal] = useState("maintain");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const u = getUnits();
    setUnitsState(u);
    const did = getDeviceId();
    api
      .getProfile(did)
      .then((p) => {
        setProfile(p);
        setAge(p.age != null ? String(p.age) : "");
        setGoal(p.goal ?? "maintain");
        if (u === "metric") {
          setWeightKg(p.weight_kg != null ? String(p.weight_kg) : "");
          setHeightCm(p.height_cm != null ? String(p.height_cm) : "");
        } else {
          setWeightLb(kgToLbStr(p.weight_kg));
          const fi = cmToFtIn(p.height_cm);
          setHeightFt(fi.ft);
          setHeightIn(fi.inch);
        }
      })
      .catch(() => {
        // No profile yet — leave fields empty.
      });
  }, []);

  function chooseUnits(u: Units) {
    setUnitsState(u);
    setUnits(u);
    if (!profile) return;
    if (u === "metric") {
      setWeightKg(profile.weight_kg != null ? String(profile.weight_kg) : "");
      setHeightCm(profile.height_cm != null ? String(profile.height_cm) : "");
    } else {
      setWeightLb(kgToLbStr(profile.weight_kg));
      const fi = cmToFtIn(profile.height_cm);
      setHeightFt(fi.ft);
      setHeightIn(fi.inch);
    }
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
          : heightFt || heightIn
              ? ftInToCm(Number(heightFt || 0), Number(heightIn || 0))
              : null;
      const p = await api.upsertProfile({
        device_id: getDeviceId(),
        age: age ? Number(age) : null,
        weight_kg,
        height_cm,
        goal,
      });
      setProfile(p);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 pt-2">
      <div>
        <h2 className="text-xl font-medium">Settings</h2>
        <p className="mt-1 text-sm text-muted">Adjust your details. Everything stays optional.</p>
      </div>

      <div className="rounded-xl2 bg-card p-4 ring-1 ring-sand">
        <div className="text-sm text-muted">Today's target</div>
        <div className="mt-1 text-3xl font-medium text-ink">
          {profile?.calorie_target ? `~${profile.calorie_target}` : "—"}
          <span className="ml-1 text-base font-normal text-muted">cal a day</span>
        </div>
        <div className="mt-1 text-xs text-muted">Recalculated whenever you update weight or goal.</div>
      </div>

      <WeightLog />

      <div className="flex gap-2">
        {(["metric", "imperial"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => chooseUnits(u)}
            className={`flex-1 rounded-xl2 px-3 py-2 text-sm ring-1 ${
              units === u ? "bg-sage/15 text-ink ring-sage" : "bg-card text-muted ring-sand"
            }`}
          >
            {u === "metric" ? "Metric (kg · cm)" : "Imperial (lb · ft/in)"}
          </button>
        ))}
      </div>

      <Field label="Age">
        <input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" className="input" placeholder="—" />
      </Field>

      {units === "metric" ? (
        <>
          <Field label="Weight, kg">
            <input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} inputMode="decimal" className="input" placeholder="—" />
          </Field>
          <Field label="Height, cm">
            <input value={heightCm} onChange={(e) => setHeightCm(e.target.value)} inputMode="numeric" className="input" placeholder="—" />
          </Field>
        </>
      ) : (
        <>
          <Field label="Weight, lb">
            <input value={weightLb} onChange={(e) => setWeightLb(e.target.value)} inputMode="decimal" className="input" placeholder="—" />
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">Height</span>
            <div className="flex gap-2">
              <input value={heightFt} onChange={(e) => setHeightFt(e.target.value)} inputMode="numeric" className="input" placeholder="ft" />
              <input value={heightIn} onChange={(e) => setHeightIn(e.target.value)} inputMode="numeric" className="input" placeholder="in" />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Goal</span>
        <div className="flex gap-2">
          {(["lose", "maintain", "gain"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGoal(g)}
              className={`flex-1 rounded-xl2 px-3 py-2 text-sm capitalize ring-1 ${
                goal === g ? "bg-sage/15 text-ink ring-sage" : "bg-card text-muted ring-sand"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>

      {savedAt && Date.now() - savedAt < 4000 && (
        <p className="text-center text-sm text-muted">Saved.</p>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          background: #1a1714;
          padding: 0.75rem 1rem;
          color: #f5efe5;
          box-shadow: inset 0 0 0 1px #3a322b;
          outline: none;
        }
      `}</style>
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
