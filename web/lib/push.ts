// Web Push subscription helpers. iOS Safari requires the site to be added to
// the home screen as a PWA before granting notification permission; on other
// platforms (Chrome Android, desktop Chrome/Edge/Firefox) it works directly.

import { api } from "./api";
import { getDeviceId } from "./device";

export function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registerSW(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return reg;
}

export async function subscribeForReminders(hourLocal: number): Promise<void> {
  if (!pushSupported()) throw new Error("Push not supported on this browser.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Permission denied.");

  const reg = await registerSW();
  const { public_key } = await api.pushPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(public_key);

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
  }

  // The subscription's keys are ArrayBuffers — convert to base64url for the server.
  const p256dh = sub.getKey("p256dh");
  const auth = sub.getKey("auth");
  if (!p256dh || !auth) throw new Error("Subscription missing keys.");

  await api.pushSubscribe({
    device_id: getDeviceId(),
    endpoint: sub.endpoint,
    keys: { p256dh: bufToB64Url(p256dh), auth: bufToB64Url(auth) },
    hour_local: hourLocal,
    tz_offset_min: -new Date().getTimezoneOffset(), // JS returns the inverse sign
  });
}

export async function unsubscribeReminders(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  await sub?.unsubscribe();
  await api.pushUnsubscribe(getDeviceId());
}

function bufToB64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
