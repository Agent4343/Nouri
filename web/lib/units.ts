export type Units = "metric" | "imperial";

const KEY = "nouri:units";

export function getUnits(): Units {
  if (typeof window === "undefined") return "metric";
  const v = localStorage.getItem(KEY);
  if (v === "imperial" || v === "metric") return v;
  // Sensible default — US locale gets imperial, everyone else metric.
  const lang = (typeof navigator !== "undefined" && navigator.language) || "";
  return lang.startsWith("en-US") ? "imperial" : "metric";
}

export function setUnits(u: Units): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, u);
}

export const lbToKg = (lb: number) => lb * 0.45359237;
export const kgToLb = (kg: number) => kg / 0.45359237;
export const ftInToCm = (ft: number, inch: number) => (ft * 12 + inch) * 2.54;
