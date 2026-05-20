// Anonymous device identity. No signup wall in the first 60 seconds (§8).

const KEY = "nouri:device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  return id;
}

export function hasOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("nouri:onboarded") === "1";
}

export function markOnboarded(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("nouri:onboarded", "1");
}
