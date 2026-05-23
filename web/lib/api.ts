import type { Meal, Profile, SavedMeal, TodaySummary, WeightEntry } from "./types";

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
  snap: (body: { device_id: string; photo_id?: string; hint?: string; meal_type?: string }) =>
    request<Meal>("/meals", { method: "POST", body: JSON.stringify(body) }),
  correct: (
    mealId: string,
    body: Partial<Pick<Meal, "label" | "calories" | "protein_g" | "carbs_g" | "fat_g">>,
  ) => request<Meal>(`/meals/${mealId}`, { method: "PATCH", body: JSON.stringify(body) }),
  today: (deviceId: string) => request<TodaySummary>(`/meals/today?device_id=${deviceId}`),
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
};
