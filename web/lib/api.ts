import type { Meal, Profile, SavedMeal, TodaySummary } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export const api = {
  upsertProfile: (body: Partial<Profile> & { device_id: string }) =>
    request<Profile>("/profile", { method: "POST", body: JSON.stringify(body) }),
  getProfile: (deviceId: string) => request<Profile>(`/profile/${deviceId}`),
  snap: (body: { device_id: string; photo_url?: string; hint?: string }) =>
    request<Meal>("/meals", { method: "POST", body: JSON.stringify(body) }),
  correct: (
    mealId: string,
    body: Partial<Pick<Meal, "label" | "calories" | "protein_g" | "carbs_g" | "fat_g">>,
  ) => request<Meal>(`/meals/${mealId}`, { method: "PATCH", body: JSON.stringify(body) }),
  today: (deviceId: string) => request<TodaySummary>(`/meals/today?device_id=${deviceId}`),
  listSaved: (deviceId: string) => request<SavedMeal[]>(`/saved?device_id=${deviceId}`),
  createSaved: (body: { device_id: string; name: string; calories: number; protein_g?: number; carbs_g?: number; fat_g?: number }) =>
    request<SavedMeal>("/saved", { method: "POST", body: JSON.stringify(body) }),
  logFromSaved: (body: { device_id: string; saved_meal_id: string }) =>
    request<Meal>("/saved/log", { method: "POST", body: JSON.stringify(body) }),
};
