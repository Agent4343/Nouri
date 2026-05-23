import type { BarcodeProduct, Meal, Profile, SavedMeal, TodaySummary, WeightEntry } from "./types";

// Calls go through the Next.js rewrite (see next.config.js) — proxied
// server-side to the backend. No CORS, no baked-in URL.
const API_URL = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<T>;
}

export type PhotoUpload = { photo_id: string; photo_url: string };

async function upload(path: string, fd: FormData): Promise<PhotoUpload> {
  const res = await fetch(`${API_URL}${path}`, { method: "POST", body: fd, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<PhotoUpload>;
}

export const api = {
  upsertProfile: (body: Partial<Profile> & { device_id: string }) =>
    request<Profile>("/profile", { method: "POST", body: JSON.stringify(body) }),
  getProfile: (deviceId: string) => request<Profile>(`/profile/${deviceId}`),
  uploadPhoto: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return upload("/photos", fd);
  },
  photoUrl: (relativeOrAbsolute: string | null | undefined) => {
    if (!relativeOrAbsolute) return null;
    if (/^https?:\/\//.test(relativeOrAbsolute)) return relativeOrAbsolute;
    return `${API_URL}${relativeOrAbsolute}`;
  },
  snap: (body: {
    device_id: string;
    photo_id?: string;
    hint?: string;
    meal_type?: string;
    logged_at?: string;
  }) => request<Meal>("/meals", { method: "POST", body: JSON.stringify(body) }),
  correct: (
    mealId: string,
    body: Partial<Pick<Meal, "label" | "calories" | "protein_g" | "carbs_g" | "fat_g">>,
  ) => request<Meal>(`/meals/${mealId}`, { method: "PATCH", body: JSON.stringify(body) }),
  today: (deviceId: string) => request<TodaySummary>(`/meals/today?device_id=${deviceId}`),
  repeatMeal: (body: { device_id: string; source_meal_id: string }) =>
    request<Meal>("/meals/repeat", { method: "POST", body: JSON.stringify(body) }),
  recentMeals: (deviceId: string, days = 14, limit = 8) =>
    request<{ source_meal_id: string; label: string; calories: number }[]>(
      `/meals/recent?device_id=${deviceId}&days=${days}&limit=${limit}`,
    ),
  deleteMeal: (mealId: string) =>
    fetch(`${API_URL}/meals/${mealId}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
    }),
  listSaved: (deviceId: string) => request<SavedMeal[]>(`/saved?device_id=${deviceId}`),
  createSaved: (body: { device_id: string; name: string; calories: number; protein_g?: number; carbs_g?: number; fat_g?: number }) =>
    request<SavedMeal>("/saved", { method: "POST", body: JSON.stringify(body) }),
  logFromSaved: (body: { device_id: string; saved_meal_id: string }) =>
    request<Meal>("/saved/log", { method: "POST", body: JSON.stringify(body) }),
  logWeight: (body: { device_id: string; kg: number }) =>
    request<WeightEntry>("/weights", { method: "POST", body: JSON.stringify(body) }),
  listWeights: (deviceId: string, days = 30) =>
    request<WeightEntry[]>(`/weights?device_id=${deviceId}&days=${days}`),
  lookupBarcode: (code: string) => request<BarcodeProduct>(`/barcode/${encodeURIComponent(code)}`),
  pushPublicKey: () => request<{ public_key: string }>("/push/public-key"),
  pushSubscribe: (body: {
    device_id: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    hour_local: number;
    tz_offset_min: number;
  }) =>
    request<{ enabled: boolean; hour_local: number; tz_offset_min: number }>("/push/subscribe", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  pushSettings: (deviceId: string) =>
    request<{ enabled: boolean; hour_local: number; tz_offset_min: number } | null>(
      `/push/settings/${deviceId}`,
    ),
  pushUpdateSettings: (body: {
    device_id: string;
    enabled: boolean;
    hour_local: number;
    tz_offset_min: number;
  }) =>
    request<{ enabled: boolean; hour_local: number; tz_offset_min: number }>("/push/settings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  pushUnsubscribe: (deviceId: string) =>
    fetch(`${API_URL}/push/subscribe/${deviceId}`, { method: "DELETE" }).then((r) => {
      if (!r.ok && r.status !== 404) throw new Error(`${r.status}`);
    }),
  pushTest: (deviceId: string) =>
    request<{ ok: boolean }>(`/push/test/${deviceId}`, { method: "POST" }),
  logManual: (body: {
    device_id: string;
    label: string;
    calories: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    source?: "manual" | "barcode";
  }) => request<Meal>("/meals/manual", { method: "POST", body: JSON.stringify(body) }),
  authStart: (email: string) =>
    request<{ sent: boolean }>("/auth/email/start", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  authVerify: (body: { device_id: string; token: string }) =>
    request<{ user_id: string | null; email: string | null }>("/auth/email/verify", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  authMe: (deviceId: string) =>
    request<{ user_id: string | null; email: string | null }>(`/auth/me/${deviceId}`),
  authSignOut: (deviceId: string) =>
    fetch(`${API_URL}/auth/sign-out/${deviceId}`, { method: "POST" }).then((r) => {
      if (!r.ok && r.status !== 404) throw new Error(`${r.status}`);
    }),
};
