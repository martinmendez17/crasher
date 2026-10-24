// Reglas de sobrecarga progresiva (doble progresión).
// Mismo criterio que la versión anterior, pero usando el rango de repeticiones
// definido en la rutina en vez de un 12 fijo.

import { nameKey } from "./utils.js";

/** 1RM estimado (fórmula de Epley). */
export function e1rm(weight, reps) {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  return w * (1 + r / 30);
}

/** "8-12" -> { min: 8, max: 12 }; "10" -> { min: 10, max: 10 }. */
export function parseRepRange(reps) {
  const nums = String(reps || "").match(/\d+/g)?.map(Number) || [];
  if (nums.length === 0) return { min: 8, max: 12 };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}

/** Busca la última vez que se registró un ejercicio (por nombre). */
export function lastPerformance(sessions, exerciseName, beforeDate = null) {
  const key = nameKey(exerciseName);
  const sorted = [...sessions].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0));
  for (const s of sorted) {
    if (beforeDate && s.date > beforeDate) continue;
    const found = (s.exercises || []).find((e) => nameKey(e.name) === key);
    if (found && found.sets?.length) return { date: s.date, sets: found.sets };
  }
  return null;
}

/**
 * Meta sugerida para una serie a partir de la misma serie de la sesión anterior.
 * - Si llegaste al tope del rango con margen (RIR >= 1), sube el peso y vuelve al mínimo de reps.
 * - Si no, mantén el peso y suma una repetición.
 */
export function suggestTarget(prevSet, repRange = "8-12", increment = 2.5) {
  if (!prevSet) return null;
  const w = Number(prevSet.weight) || 0;
  const r = Number(prevSet.reps) || 0;
  const rir = prevSet.rir === null || prevSet.rir === undefined || prevSet.rir === "" ? 2 : Number(prevSet.rir);
  const { min, max } = parseRepRange(repRange);

  if (w > 0 && r >= max && rir >= 1) {
    const step = w < 15 ? Math.min(1.25, increment) : increment;
    return { weight: round(w + step), reps: min, raised: true };
  }
  return { weight: w, reps: r + 1, raised: false };
}

/** Compara una serie hecha con la anterior: "up" | "same" | "down" | null. */
export function compareSet(cur, prev) {
  if (!cur || !prev) return null;
  const w = Number(cur.weight), r = Number(cur.reps);
  if (!Number.isFinite(w) || !Number.isFinite(r) || cur.reps === "" || cur.weight === "") return null;
  const pw = Number(prev.weight) || 0;
  const pr = Number(prev.reps) || 0;
  // Doble progresión: más peso, o mismo peso con más repeticiones, es progreso.
  if (w > pw || (w === pw && r > pr) || e1rm(w, r) > e1rm(pw, pr) + 0.05) return "up";
  if (w === pw && r === pr) return "same";
  return "down";
}

function round(x) {
  return Math.round(x * 100) / 100;
}
