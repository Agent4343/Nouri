// Fire-and-forget analytics. Sent through the same /api proxy as everything
// else, so they're just normal backend hits — no third-party tracker in the
// page bundle, no consent banner needed for V1.

import { getDeviceId } from "./device";

export function track(type: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ device_id: getDeviceId(), type, data: data ?? {} });
  // keepalive lets the request survive a same-tick navigation (e.g. router.replace
  // right after we track meal_logged).
  fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Swallow — analytics must never break the flow.
  });
}
