"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { getUnits, type Units } from "@/lib/units";
import type { WeightEntry } from "@/lib/types";

const KG_PER_LB = 0.45359237;

export function WeightSummary() {
  const [units, setUnits] = useState<Units>("metric");
  const [entries, setEntries] = useState<WeightEntry[] | null>(null);

  useEffect(() => {
    setUnits(getUnits());
    api
      .listWeights(getDeviceId(), 30)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  const display = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    const latest = entries[entries.length - 1];
    if (units === "metric") return `${latest.kg.toFixed(1)} kg`;
    return `${(latest.kg / KG_PER_LB).toFixed(1)} lb`;
  }, [entries, units]);

  const delta = useMemo(() => {
    if (!entries || entries.length < 2) return null;
    const latest = entries[entries.length - 1];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const older = [...entries].reverse().find((e) => new Date(e.logged_at).getTime() < sevenDaysAgo);
    if (!older) return null;
    const diffKg = latest.kg - older.kg;
    const v = units === "metric" ? diffKg : diffKg / KG_PER_LB;
    const sign = v >= 0 ? "+" : "−";
    return `${sign}${Math.abs(v).toFixed(1)} ${units === "metric" ? "kg" : "lb"} this week`;
  }, [entries, units]);

  if (!entries || entries.length === 0) return null;

  return (
    <Link
      href="/settings"
      className="block rounded-xl2 bg-card p-4 ring-1 ring-sand transition hover:bg-card"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm text-muted">Weight</div>
          <div className="mt-0.5 text-2xl font-medium text-ink">{display}</div>
          {delta && <div className="mt-0.5 text-xs text-muted">{delta}</div>}
        </div>
        <Sparkline entries={entries} units={units} />
      </div>
    </Link>
  );
}

function Sparkline({ entries, units }: { entries: WeightEntry[]; units: Units }) {
  const W = 96;
  const H = 32;
  const pts = entries.map((e) => (units === "metric" ? e.kg : e.kg / KG_PER_LB));
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = Math.max(0.2, max - min);
  const stepX = pts.length > 1 ? W / (pts.length - 1) : 0;
  const d = pts
    .map((v, i) => {
      const x = i * stepX;
      const y = H - ((v - min) / span) * (H - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-24 text-sage" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
