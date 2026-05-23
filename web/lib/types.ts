export type Profile = {
  device_id: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: string | null;
  calorie_target: number | null;
};

export type MealAlternative = { label: string; calories: number };

export type Meal = {
  id: string;
  device_id: string;
  label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
  photo_url: string | null;
  source: "photo" | "saved" | "manual";
  corrected: boolean;
  logged_at: string;
  alternatives?: MealAlternative[];
};

export type WeeklyDayTotal = {
  date: string; // YYYY-MM-DD
  calories: number;
};

export type TodaySummary = {
  device_id: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  target_calories: number | null;
  meals: Meal[];
  message: string;
  week: WeeklyDayTotal[];
  days_since_last_log: number;
};

export type SavedMeal = {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};
