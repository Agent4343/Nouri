"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { pushSupported, subscribeForReminders, unsubscribeReminders } from "@/lib/push";
import { track } from "@/lib/track";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function formatHour(h: number): string {
  const ampm = h < 12 ? "am" : "pm";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}${ampm}`;
}

export function RemindersCard() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const s = pushSupported();
    setSupported(s);
    if (!s) return;
    api
      .pushSettings(getDeviceId())
      .then((cfg) => {
        if (cfg) {
          setEnabled(cfg.enabled);
          setHour(cfg.hour_local);
        }
      })
      .catch(() => {});
  }, []);

  async function enable() {
    setWorking(true);
    setErr(null);
    setInfo(null);
    try {
      await subscribeForReminders(hour);
      setEnabled(true);
      track("reminders_enabled", { hour_local: hour });
      setInfo("Reminders on. Quiet check-in around " + formatHour(hour) + ".");
    } catch (e: unknown) {
      setErr(
        typeof e === "object" && e && "message" in e
          ? String((e as { message: string }).message)
          : "Couldn't enable reminders.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function disable() {
    setWorking(true);
    setErr(null);
    try {
      await unsubscribeReminders();
      setEnabled(false);
      setInfo("Reminders off.");
    } finally {
      setWorking(false);
    }
  }

  async function updateHour(next: number) {
    setHour(next);
    if (!enabled) return;
    setWorking(true);
    try {
      await api.pushUpdateSettings({
        device_id: getDeviceId(),
        enabled: true,
        hour_local: next,
        tz_offset_min: -new Date().getTimezoneOffset(),
      });
      setInfo("Reminder time updated to " + formatHour(next) + ".");
    } finally {
      setWorking(false);
    }
  }

  async function test() {
    setWorking(true);
    try {
      await api.pushTest(getDeviceId());
      setInfo("Test sent — should arrive within a few seconds.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl2 bg-card p-4 ring-1 ring-sand">
      <div>
        <div className="text-sm text-muted">Quiet reminder</div>
        <div className="mt-0.5 text-base text-ink">
          {enabled ? `On · around ${formatHour(hour)}` : "Off"}
        </div>
      </div>

      {!supported ? (
        <p className="text-xs text-muted">
          This browser doesn't support push reminders. On iPhone, add Nouri to your home screen
          first, then come back to enable.
        </p>
      ) : (
        <>
          <label className="flex items-center gap-2 text-sm text-muted">
            Time
            <select
              value={hour}
              onChange={(e) => updateHour(Number(e.target.value))}
              disabled={working}
              className="rounded-lg bg-cream px-2 py-1 text-ink ring-1 ring-sand outline-none"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            {enabled ? (
              <>
                <button
                  onClick={test}
                  disabled={working}
                  className="flex-1 rounded-xl2 bg-card px-4 py-2 text-sm text-ink ring-1 ring-sand disabled:opacity-60"
                >
                  Send test
                </button>
                <button
                  onClick={disable}
                  disabled={working}
                  className="flex-1 rounded-xl2 bg-card px-4 py-2 text-sm text-muted ring-1 ring-sand disabled:opacity-60"
                >
                  Turn off
                </button>
              </>
            ) : (
              <button
                onClick={enable}
                disabled={working}
                className="flex-1 rounded-xl2 bg-sage px-4 py-2 text-sm text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
              >
                {working ? "…" : "Turn on"}
              </button>
            )}
          </div>
        </>
      )}

      {err && <p className="text-xs text-ink">{err}</p>}
      {info && !err && <p className="text-xs text-muted">{info}</p>}
    </div>
  );
}
