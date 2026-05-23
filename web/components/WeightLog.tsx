"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { getUnits, lbToKg, type Units } from "@/lib/units";
import type { WeightEntry } from "@/lib/types";

const KG_PER_LB = 0.45359237;

export function WeightLog() {
  const [units, setUnits] = useState<Units>("metric");
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const list = await api.listWeights(getDeviceId(), 90);
      setEntries(list);
    } catch {
      setEntries([]);
    }
  }

  useEffect(() => {
    setUnits(getUnits());
    refresh();
  }, []);

  async function save() {
    if (!value) return;
    const kg = units === "metric" ? Number(value) : lbToKg(Number(value));
    if (!Number.isFinite(kg) || kg <= 0) return;
    setSaving(true);
    try {
      await api.logWeight({ device_id: getDeviceId(), kg });
      setValue("");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const display = useMemo(() => {
    if (!latest) return null;
    if (units === "metric") return `${latest.kg.toFixed(1)} kg`;
    return `${(latest.kg / KG_PER_LB).toFixed(1)} lb`;
  }, [latest, units]);

  return (
    <div className="flex flex-col gap-3 rounded-xl2 bg-card p-4 ring-1 ring-sand">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm text-muted">Weight</div>
          <div className="mt-0.5 text-base text-ink">
            {display ?? "No entries yet."}
          </div>
        </div>
        {entries.length >= 2 && <Sparkline entries={entries} units={units} />}
      </div>

      <div className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={units === "metric" ? "kg today" : "lb today"}
          className="flex-1 rounded-lg bg-cream px-3 py-2 ring-1 ring-sand outline-none"
        />
        <button
          onClick={save}
          disabled={saving || !value}
          className="rounded-xl2 bg-sage px-4 py-2 text-sm text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
        >
          {saving ? "…" : "Log"}
        </button>
      </div>
    </div>
  );
}

function Sparkline({ entries, units }: { entries: WeightEntry[]; units: Units }) {
  // Quiet trend line — no axis labels, no numbers. Just a shape.
  const W = 80;
  const H = 24;
  const pts = entries.map((e) => (units === "metric" ? e.kg : e.kg / KG_PER_LB));
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = Math.max(0.2, max - min);
  const stepX = pts.length > 1 ? W / (pts.length - 1) : 0;
  const d = pts
    .map((v, i) => {
      const x = i * stepX;
      const y = H - ((v - min) / span) * H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-6 w-20 text-sage" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
