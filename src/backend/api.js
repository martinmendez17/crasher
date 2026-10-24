// API del backend.
// Es la ÚNICA puerta de entrada a los datos: el frontend nunca toca
// localStorage directamente. Todas las funciones son asíncronas (devuelven
// Promise) igual que si hablaran con un servidor, así que migrar a un
// backend real solo requiere reimplementar este archivo con fetch().

import BUILTIN_EXERCISES from "./data/exercises.json";
import { TEMPLATES } from "./data/templates.js";
import { PATTERN_BY_MUSCLE, MUSCLE_LABEL } from "./data/catalogs.js";
import { GOALS, DEFAULT_GOAL } from "./data/trainingGoals.js";
import * as store from "./storage/localStore.js";
import { clone, uid, slugify, todayISO, nameKey } from "./domain/utils.js";
import { e1rm } from "./domain/progression.js";
import { convertLegacy, isLegacyBackup, readLegacyFromBrowser } from "./migration.js";

export const DEFAULT_SETTINGS = {
  theme: "system", // "system" | "light" | "dark"
  showRIR: true,
  showRPE: false,
  showNotes: true,
  showHints: true,
  restSeconds: 90,
  increment: 2.5,
};

// ---------------------------------------------------------------------------
// Estado interno (se carga una vez desde el almacenamiento)
// ---------------------------------------------------------------------------
let db = null;

function load() {
  if (db) return db;
  db = {
    customExercises: store.read("customExercises", []),
    routines: store.read("routines", []),
    activeRoutineId: store.read("activeRoutineId", null),
    sessions: store.read("sessions", []),
    settings: { ...DEFAULT_SETTINGS, ...store.read("settings", {}) },
    draft: store.read("draft", null),
  };
  if (!store.has("initialized")) {
    migrateFromBrowserIfNeeded();
    store.write("initialized", { at: Date.now(), version: 2 });
  }
  return db;
}

function persist(...keys) {
  for (const k of keys) store.write(k, db[k]);
}

const delay = (v) => Promise.resolve(clone(v));

function catalog() {
  return [...BUILTIN_EXERCISES, ...db.customExercises];
}

function exerciseById(id) {
  return catalog().find((e) => e.id === id) || null;
}

function migrateFromBrowserIfNeeded() {
  const legacy = readLegacyFromBrowser(store.readLegacy);
  if (!legacy) return;
  applyLegacy(legacy, { replace: true });
}

function applyLegacy(legacy, { replace }) {
  const ids = new Set(catalog().map((e) => e.id));
  const { routine, sessions, customExercises, settings } = convertLegacy(legacy, ids);
  db.customExercises = [...db.customExercises, ...customExercises];
  // Completa músculo/foco usando el catálogo
  for (const day of routine.days) {
    day.focus = [...new Set(day.exercises.map((i) => exerciseById(i.exerciseId)?.muscle).filter(Boolean))];
  }
  for (const s of sessions) {
    for (const e of s.exercises) {
      const ex = exerciseById(e.exerciseId);
      if (ex) e.muscle = ex.muscle;
    }
  }
  db.routines = replace ? [routine] : [...db.routines, routine];
  db.activeRoutineId = routine.id;
  db.sessions = replace ? sessions : [...db.sessions, ...sessions];
  db.settings = { ...db.settings, ...settings };
  persist("customExercises", "routines", "activeRoutineId", "sessions", "settings");
}

// ---------------------------------------------------------------------------
// Ejercicios
// ---------------------------------------------------------------------------
const exercises = {
  async list() {
    load();
    return delay(catalog());
  },
  async create({ name, muscle, equipment = "peso-corporal", video = "" }) {
    load();
    const clean = String(name || "").trim();
    if (!clean) throw new Error("Escribe el nombre del ejercicio.");
    if (!MUSCLE_LABEL[muscle]) throw new Error("Elige el músculo principal.");
    if (catalog().some((e) => nameKey(e.name) === nameKey(clean))) {
      throw new Error(`Ya existe un ejercicio llamado “${clean}”.`);
    }
    const ex = {
      id: "custom-" + slugify(clean) + "-" + Math.random().toString(36).slice(2, 6),
      name: clean,
      muscle,
      pattern: PATTERN_BY_MUSCLE[muscle] || "core",
      equipment,
      home: equipment === "goma" || equipment === "peso-corporal",
      video: video?.trim() || null,
      source: "custom",
      tags: [],
    };
    db.customExercises.push(ex);
    persist("customExercises");
    return delay(ex);
  },
  async remove(id) {
    load();
    const used = db.routines.some((r) => r.days.some((d) => d.exercises.some((i) => i.exerciseId === id)));
    if (used) throw new Error("Este ejercicio está en una de tus rutinas. Quítalo de la rutina antes de borrarlo.");
    db.customExercises = db.customExercises.filter((e) => e.id !== id);
    persist("customExercises");
    return delay(true);
  },
};

// ---------------------------------------------------------------------------
// Modelos de entrenamiento (plantillas, solo lectura)
// ---------------------------------------------------------------------------
const templates = {
  async list() {
    return delay(TEMPLATES);
  },
};

// ---------------------------------------------------------------------------
// Rutinas del usuario
// ---------------------------------------------------------------------------
function routineFromTemplate(t) {
  return {
    id: uid("rt"),
    name: t.name,
    templateId: t.id,
    description: t.description,
    schedule: t.schedule,
    cyclesPerWeek: t.cyclesPerWeek || 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    days: t.days.map((d) => ({
      id: uid("day"),
      name: d.name,
      goal: d.goal || DEFAULT_GOAL,
      focus: [...d.focus],
      exercises: d.exercises.map((e) => ({ id: uid("it"), ...clone(e) })),
    })),
  };
}

function validateRoutine(r) {
  if (!String(r.name || "").trim()) throw new Error("La rutina necesita un nombre.");
  if (!r.days?.length) throw new Error("La rutina necesita al menos un día.");
  const c = Number(r.cyclesPerWeek);
  r.cyclesPerWeek = Number.isFinite(c) && c > 0 ? Math.min(c, 7) : 1;
  r.days.forEach((d, i) => {
    if (!String(d.name || "").trim()) d.name = `Día ${i + 1}`;
    if (!GOALS[d.goal]) d.goal = DEFAULT_GOAL;
    d.exercises = (d.exercises || []).map((it) => ({
      ...it,
      sets: Math.max(1, Math.min(20, parseInt(it.sets, 10) || 1)),
      reps: String(it.reps || "8-12").trim() || "8-12",
    }));
  });
}

const routines = {
  async list() {
    load();
    return delay(db.routines);
  },
  async get(id) {
    load();
    return delay(db.routines.find((r) => r.id === id) || null);
  },
  async getActiveId() {
    load();
    const exists = db.routines.some((r) => r.id === db.activeRoutineId);
    return delay(exists ? db.activeRoutineId : db.routines[0]?.id || null);
  },
  async setActive(id) {
    load();
    db.activeRoutineId = id;
    persist("activeRoutineId");
    return delay(id);
  },
  async createFromTemplate(templateId) {
    load();
    const t = TEMPLATES.find((x) => x.id === templateId);
    if (!t) throw new Error("No se encontró ese modelo de entrenamiento.");
    const r = routineFromTemplate(t);
    // Evita nombres repetidos
    const same = db.routines.filter((x) => x.name === r.name || x.name.startsWith(r.name + " (")).length;
    if (same) r.name = `${r.name} (${same + 1})`;
    db.routines.push(r);
    db.activeRoutineId = r.id;
    persist("routines", "activeRoutineId");
    return delay(r);
  },
  async createBlank(name = "Rutina nueva") {
    load();
    const r = {
      id: uid("rt"),
      name,
      templateId: null,
      description: "",
      cyclesPerWeek: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      days: [{ id: uid("day"), name: "Día 1", goal: DEFAULT_GOAL, focus: [], exercises: [] }],
    };
    db.routines.push(r);
    db.activeRoutineId = r.id;
    persist("routines", "activeRoutineId");
    return delay(r);
  },
  async save(routine) {
    load();
    const r = clone(routine);
    validateRoutine(r);
    r.name = r.name.trim();
    r.updatedAt = Date.now();
    const i = db.routines.findIndex((x) => x.id === r.id);
    if (i === -1) db.routines.push(r);
    else db.routines[i] = r;
    persist("routines");
    return delay(r);
  },
  async duplicate(id) {
    load();
    const src = db.routines.find((r) => r.id === id);
    if (!src) throw new Error("No se encontró la rutina.");
    const r = clone(src);
    r.id = uid("rt");
    r.name = `${src.name} (copia)`;
    r.createdAt = r.updatedAt = Date.now();
    r.days.forEach((d) => { d.id = uid("day"); d.exercises.forEach((it) => { it.id = uid("it"); }); });
    db.routines.push(r);
    persist("routines");
    return delay(r);
  },
  async remove(id) {
    load();
    db.routines = db.routines.filter((r) => r.id !== id);
    if (db.activeRoutineId === id) db.activeRoutineId = db.routines[0]?.id || null;
    if (db.draft?.routineId === id) { db.draft = null; persist("draft"); }
    persist("routines", "activeRoutineId");
    return delay(true);
  },
};

// ---------------------------------------------------------------------------
// Sesiones de entrenamiento
// ---------------------------------------------------------------------------
const sessions = {
  async list() {
    load();
    return delay(db.sessions);
  },
  async create(input) {
    load();
    const exercisesDone = (input.exercises || [])
      .map((e) => ({
        exerciseId: e.exerciseId || null,
        name: String(e.name || "").trim(),
        muscle: e.muscle || exerciseById(e.exerciseId)?.muscle || "core",
        note: String(e.note || "").trim(),
        sets: (e.sets || [])
          .filter((s) => s.weight !== "" || s.reps !== "")
          .map((s) => ({
            weight: Number(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
            rir: s.rir === "" || s.rir === undefined || s.rir === null ? null : Number(s.rir),
            rpe: s.rpe === "" || s.rpe === undefined || s.rpe === null ? null : Number(s.rpe),
          })),
      }))
      .filter((e) => e.sets.length > 0);
    if (!exercisesDone.length) throw new Error("Completa al menos una serie (peso o repeticiones) antes de guardar.");
    const s = {
      id: uid("ses"),
      date: input.date || todayISO(),
      createdAt: Date.now(),
      routineId: input.routineId || null,
      routineName: input.routineName || "",
      dayId: input.dayId || null,
      dayName: input.dayName || "Sesión libre",
      notes: String(input.notes || "").trim(),
      durationMin: input.durationMin || null,
      exercises: exercisesDone,
    };
    db.sessions.push(s);
    persist("sessions");
    return delay(s);
  },
  async remove(id) {
    load();
    db.sessions = db.sessions.filter((s) => s.id !== id);
    persist("sessions");
    return delay(true);
  },
  async clear() {
    load();
    db.sessions = [];
    persist("sessions");
    return delay(true);
  },
};

// ---------------------------------------------------------------------------
// Entrenamiento en curso (borrador), para no perder datos al cambiar de pantalla
// ---------------------------------------------------------------------------
const draft = {
  async get() {
    load();
    return delay(db.draft);
  },
  async save(d) {
    load();
    db.draft = d ? clone(d) : null;
    persist("draft");
    return delay(db.draft);
  },
  async clear() {
    load();
    db.draft = null;
    persist("draft");
    return delay(null);
  },
};

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------
const settings = {
  async get() {
    load();
    return delay(db.settings);
  },
  async save(patch) {
    load();
    db.settings = { ...db.settings, ...patch };
    persist("settings");
    return delay(db.settings);
  },
};

// ---------------------------------------------------------------------------
// Respaldo: exportar / importar / borrar
// ---------------------------------------------------------------------------
const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const backup = {
  async exportJSON() {
    load();
    return JSON.stringify(
      {
        app: "crasher00",
        version: 2,
        exportedAt: new Date().toISOString(),
        customExercises: db.customExercises,
        routines: db.routines,
        activeRoutineId: db.activeRoutineId,
        sessions: db.sessions,
        settings: db.settings,
      },
      null,
      2,
    );
  },
  async exportCSV() {
    load();
    const rows = [["Fecha", "Rutina", "Día", "Ejercicio", "Músculo", "Serie", "PesoKg", "Reps", "RIR", "RPE", "1RM estimado"]];
    [...db.sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((s) =>
        s.exercises.forEach((e) =>
          e.sets.forEach((st, i) =>
            rows.push([s.date, s.routineName, s.dayName, e.name, MUSCLE_LABEL[e.muscle] || e.muscle, i + 1, st.weight, st.reps, st.rir ?? "", st.rpe ?? "", e1rm(st.weight, st.reps).toFixed(1)]),
          ),
        ),
      );
    return rows.map((r) => r.map(csvCell).join(",")).join("\n");
  },
  /** Importa un respaldo. Acepta el formato nuevo (v2) y el de la versión anterior. */
  async importJSON(text) {
    load();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("El archivo no es un JSON válido.");
    }
    if (data?.app === "crasher00" && data.version === 2) {
      db.customExercises = Array.isArray(data.customExercises) ? data.customExercises : [];
      db.routines = Array.isArray(data.routines) ? data.routines : [];
      db.activeRoutineId = data.activeRoutineId || db.routines[0]?.id || null;
      db.sessions = Array.isArray(data.sessions) ? data.sessions : [];
      db.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
      db.draft = null;
      persist("customExercises", "routines", "activeRoutineId", "sessions", "settings", "draft");
      return delay({ format: "v2", sessions: db.sessions.length, routines: db.routines.length });
    }
    if (isLegacyBackup(data)) {
      applyLegacy(
        { routines: data.routines || {}, slotMap: data.slotMap || {}, sessions: data.sessions || [], settings: data.settings || {} },
        { replace: false },
      );
      return delay({ format: "v1", sessions: (data.sessions || []).length, routines: 1 });
    }
    throw new Error("No reconozco el formato de este archivo. Usa un respaldo exportado desde Crasher.");
  },
  async resetAll() {
    load();
    db.customExercises = [];
    db.routines = [];
    db.activeRoutineId = null;
    db.sessions = [];
    db.draft = null;
    persist("customExercises", "routines", "activeRoutineId", "sessions", "draft");
    return delay(true);
  },
};

export const api = { exercises, templates, routines, sessions, draft, settings, backup, isPersistent: store.isPersistent };
export default api;
