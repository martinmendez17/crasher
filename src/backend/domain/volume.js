// Volumen semanal por músculo comparado con las referencias (MV, MEV, MAV, MRV).

import { LANDMARKS } from "../data/volumeLandmarks.js";
import { daysBetween, todayISO } from "./utils.js";

/**
 * Zonas, de menor a mayor volumen:
 *   low         — bajo el volumen de mantenimiento
 *   maintenance — mantienes, pero no alcanza para progresar
 *   effective   — sobre el mínimo efectivo (MEV)
 *   optimal     — dentro del máximo adaptativo (MAV): lo ideal
 *   high        — sobre el MAV y bajo el MRV: vigila la fatiga
 *   over        — en o sobre el MRV: riesgo de sobrefatiga
 */
export const ZONES = {
  low: { label: "Bajo mantenimiento", short: "Muy bajo", tone: "neutral" },
  maintenance: { label: "Mantenimiento", short: "Mantiene", tone: "neutral" },
  effective: { label: "Efectivo", short: "Efectivo", tone: "info" },
  optimal: { label: "Óptimo", short: "Óptimo", tone: "success" },
  high: { label: "Alto: vigila la fatiga", short: "Alto", tone: "warning" },
  over: { label: "Sobre el máximo recuperable", short: "Excesivo", tone: "danger" },
};

export function volumeZone(muscle, sets) {
  const L = LANDMARKS[muscle];
  if (!L) return null;
  const v = Number(sets) || 0;
  if (v >= L.mrv) return "over";
  if (v > L.mav[1]) return "high";
  if (v >= L.mav[0] && v > 0) return "optimal";
  if (v >= Math.max(1, L.mev[0])) return "effective";
  if (v >= L.mv[0]) return "maintenance";
  return "low";
}

/** Series que faltan para llegar al mínimo efectivo, o que sobran respecto del MRV. */
const series = (n) => `${n} ${n === 1 ? "serie" : "series"}`;

export function volumeAdvice(muscle, sets) {
  const L = LANDMARKS[muscle];
  if (!L) return null;
  const v = Number(sets) || 0;
  const zone = volumeZone(muscle, v);
  if (zone === "over") return `Baja al menos ${series(v - L.mav[1])} para volver al rango óptimo (${L.mav[0]}-${L.mav[1]}).`;
  if (zone === "high") return `Estás cerca del máximo recuperable (${L.mrv}). Si notas fatiga acumulada, baja series.`;
  if (zone === "optimal") return null;
  if (zone === "effective") return `Para el rango óptimo te ${L.mav[0] - v === 1 ? "falta" : "faltan"} ${series(L.mav[0] - v)} (${L.mav[0]}-${L.mav[1]}).`;
  const toMev = Math.max(1, L.mev[0]) - v;
  return `Te ${toMev === 1 ? "falta" : "faltan"} ${series(toMev)} para empezar a progresar (mínimo efectivo: ${L.mev[0]}-${L.mev[1]}).`;
}

/**
 * Series realizadas por músculo en los últimos `days` días.
 * Usa el músculo actual del catálogo cuando el ejercicio existe (si se reclasificó).
 */
export function weeklyVolume(sessions, exById, days = 7, today = todayISO()) {
  const sets = {};
  const daysTrained = {};
  for (const s of sessions) {
    if (!s.date) continue;
    const ago = daysBetween(s.date, today);
    if (ago < 0 || ago >= days) continue;
    const seen = new Set();
    for (const e of s.exercises || []) {
      const m = exById?.get(e.exerciseId)?.muscle || e.muscle || "core";
      sets[m] = (sets[m] || 0) + (e.sets?.length || 0);
      seen.add(m);
    }
    seen.forEach((m) => { daysTrained[m] = (daysTrained[m] || 0) + 1; });
  }
  return { sets, freq: daysTrained };
}

/**
 * Volumen semanal planificado de una rutina:
 * suma las series de cada día × las veces por semana que se hace el ciclo.
 */
export function plannedVolume(routine, exById) {
  const cycles = Number(routine?.cyclesPerWeek) || 1;
  const sets = {};
  const freq = {};
  for (const d of routine?.days || []) {
    const seen = new Set();
    for (const it of d.exercises || []) {
      const m = exById?.get(it.exerciseId)?.muscle;
      if (!m) continue;
      sets[m] = (sets[m] || 0) + (parseInt(it.sets, 10) || 0) * cycles;
      seen.add(m);
    }
    seen.forEach((m) => { freq[m] = (freq[m] || 0) + cycles; });
  }
  for (const k of Object.keys(sets)) sets[k] = Math.round(sets[k] * 10) / 10;
  return { sets, freq, cycles };
}

/** Avisos de sobrefatiga: músculos en zona "high" u "over". */
export function fatigueWarnings(setsByMuscle) {
  return Object.entries(setsByMuscle)
    .map(([muscle, sets]) => ({ muscle, sets, zone: volumeZone(muscle, sets), mrv: LANDMARKS[muscle]?.mrv }))
    .filter((w) => w.zone === "over" || w.zone === "high")
    .sort((a, b) => (a.zone === b.zone ? b.sets - a.sets : a.zone === "over" ? -1 : 1));
}

/** "Frecuencia baja" si el músculo se trabaja menos días por semana que el mínimo recomendado. */
export function frequencyStatus(muscle, timesPerWeek) {
  const L = LANDMARKS[muscle];
  if (!L || !timesPerWeek) return null;
  if (timesPerWeek < L.freq[0]) return "low";
  if (timesPerWeek > L.freq[1]) return "high";
  return "ok";
}
