"use client";
import { useEffect, useState } from "react";

type Stats = {
  as_of: string;
  active_users: { dau: number; wau: number; mau: number };
  totals: Record<string, number>;
  engagement: Record<string, number | null>;
  meal_sources: Record<string, number>;
  events: Record<string, number>;
};

const KEY_STORE = "nouri:admin_key";

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY_STORE);
    if (saved) {
      setKey(saved);
      load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(k: string) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(k)}`, { cache: "no-store" });
      if (res.status === 403) {
        setErr("Wrong key.");
        setStats(null);
        return;
      }
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as Stats;
      setStats(data);
      localStorage.setItem(KEY_STORE, k);
    } catch {
      setErr("Couldn't load stats.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 pt-2">
      <h1 className="text-2xl font-medium">Stats</h1>

      <div className="flex gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          className="flex-1 rounded-xl2 bg-card px-4 py-3 text-ink ring-1 ring-sand outline-none"
        />
        <button
          onClick={() => load(key)}
          disabled={loading || !key}
          className="rounded-xl2 bg-sage px-4 py-3 text-sm text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
        >
          {loading ? "…" : "Load"}
        </button>
      </div>

      {err && <p className="text-sm text-ink">{err}</p>}

      {stats && (
        <div className="flex flex-col gap-4">
          <Card title="Active users">
            <Row label="Today (DAU)" value={stats.active_users.dau} />
            <Row label="This week (WAU)" value={stats.active_users.wau} />
            <Row label="This month (MAU)" value={stats.active_users.mau} />
          </Card>

          <Card title="Totals">
            {Object.entries(stats.totals).map(([k, v]) => (
              <Row key={k} label={pretty(k)} value={v} />
            ))}
          </Card>

          <Card title="Engagement">
            {Object.entries(stats.engagement).map(([k, v]) => (
              <Row key={k} label={pretty(k)} value={v ?? "—"} />
            ))}
          </Card>

          <Card title="Meal sources">
            {Object.entries(stats.meal_sources).map(([k, v]) => (
              <Row key={k} label={pretty(k)} value={v} />
            ))}
          </Card>

          {Object.keys(stats.events).length > 0 && (
            <Card title="Tracked events">
              {Object.entries(stats.events).map(([k, v]) => (
                <Row key={k} label={pretty(k)} value={v} />
              ))}
            </Card>
          )}

          <p className="text-center text-xs text-muted">as of {stats.as_of}</p>
        </div>
      )}
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl2 bg-card p-4 ring-1 ring-sand">
      <div className="mb-2 text-sm text-muted">{title}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function pretty(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
