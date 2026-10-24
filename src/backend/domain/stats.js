// Cálculos para la pantalla de Progreso.

import { e1rm } from "./progression.js";
import { nameKey, daysBetween, todayISO } from "./utils.js";

export const METRICS = [
  { id: "maxWeight", label: "Peso máx.", long: "Peso máximo", unit: "kg" },
  { id: "e1rm", label: "1RM est.", long: "1RM estimado", unit: "kg" },
  { id: "volume", label: "Volumen", long: "Volumen (kg × reps)", unit: "kg" },
];

export function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 };
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  points.forEach((p, i) => {
    const x = i + 1;
    sx += x; sy += p.y; sxy += x * p.y; sxx += x * x;
  });
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

function metricOf(sets, metric) {
  let maxW = 0, best = 0, vol = 0;
  for (const st of sets) {
    const w = Number(st.weight) || 0;
    const r = Number(st.reps) || 0;
    maxW = Math.max(maxW, w);
    best = Math.max(best, e1rm(w, r));
    vol += w * r;
  }
  if (metric === "e1rm") return round1(best);
  if (metric === "volume") return Math.round(vol);
  return round1(maxW);
}

/** Serie temporal de un ejercicio: [{ date, y }] ordenada por fecha. */
export function exerciseSeries(sessions, exerciseName, metric = "maxWeight") {
  const key = nameKey(exerciseName);
  return [...sessions]
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .flatMap((s) => {
      const ex = (s.exercises || []).find((e) => nameKey(e.name) === key);
      return ex?.sets?.length ? [{ date: s.date, y: metricOf(ex.sets, metric) }] : [];
    });
}

/** Lista de ejercicios registrados alguna vez, con su músculo y nº de sesiones. */
export function loggedExercises(sessions) {
  const map = new Map();
  for (const s of sessions) {
    for (const e of s.exercises || []) {
      const k = nameKey(e.name);
      const cur = map.get(k) || { name: e.name, muscle: e.muscle, count: 0, last: "" };
      cur.count += 1;
      if ((s.date || "") >= cur.last) { cur.last = s.date; cur.name = e.name; cur.muscle = e.muscle || cur.muscle; }
      map.set(k, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.last.localeCompare(a.last) || b.count - a.count);
}

/** Series por músculo en los últimos `days` días (por defecto, una semana). */
export function setsByMuscle(sessions, days = 7, today = todayISO()) {
  const out = {};
  for (const s of sessions) {
    if (!s.date) continue;
    const ago = daysBetween(s.date, today);
    if (ago < 0 || ago >= days) continue;
    for (const e of s.exercises || []) {
      const m = e.muscle || "otros";
      out[m] = (out[m] || 0) + (e.sets?.length || 0);
    }
  }
  return out;
}

export function summary(sessions, today = todayISO()) {
  let sets = 0, tonnage = 0, last30 = 0;
  for (const s of sessions) {
    if (s.date && daysBetween(s.date, today) < 30 && daysBetween(s.date, today) >= 0) last30++;
    for (const e of s.exercises || []) {
      for (const st of e.sets || []) {
        sets++;
        tonnage += (Number(st.weight) || 0) * (Number(st.reps) || 0);
      }
    }
  }
  return { sessions: sessions.length, sets, tonnage, last30 };
}

function round1(x) {
  return Math.round(x * 10) / 10;
}
