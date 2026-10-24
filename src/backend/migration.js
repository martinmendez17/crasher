// Convierte datos de la versión anterior (Crasher02, un solo index.html)
// al modelo nuevo. Se usa al abrir la app por primera vez si el navegador
// tiene datos viejos, y al importar un respaldo JSON antiguo.

import { TEMPLATES, LEGACY_NAME_MAP } from "./data/templates.js";
import { nameKey, slugify, uid } from "./domain/utils.js";
import { PATTERN_BY_MUSCLE } from "./data/catalogs.js";

const LEGACY_KEYS = {
  routines: "crasher02_routines_v1",
  slots: "crasher02_slots_v1",
  sessions: "crasher02_sessions_v1",
  settings: "crasher02_settings_v1",
};

const SLOT_ORDER = ["PUSH", "PULL", "ARM", "LEG"];

/** "Hombro Post." -> "hombros", "Glúteo" -> "gluteos", etc. */
export function legacyMuscleToId(label) {
  const k = nameKey(label);
  if (k.startsWith("hombro") || k.startsWith("delt")) return "hombros";
  if (k.startsWith("pecho")) return "pecho";
  if (k.startsWith("tricep")) return "triceps";
  if (k.startsWith("bicep")) return "biceps";
  if (k.startsWith("espalda") || k.startsWith("trapecio") || k.startsWith("dorsal")) return "espalda";
  if (k.startsWith("cuadri")) return "cuadriceps";
  if (k.startsWith("isquio") || k.startsWith("femoral")) return "isquios";
  if (k.startsWith("glute")) return "gluteos";
  if (k.startsWith("aductor")) return "aductores";
  if (k.startsWith("gemel") || k.startsWith("pantorr")) return "gemelos";
  if (k.startsWith("core") || k.startsWith("abd")) return "core";
  return "core";
}

export function renameLegacy(name) {
  return LEGACY_NAME_MAP[nameKey(name)] || String(name || "Ejercicio").trim();
}

// alias de la plantilla original -> id del catálogo
const ALIAS_TO_ID = (() => {
  const t = TEMPLATES.find((x) => x.id === "crasher-ppal");
  const m = {};
  t.days.forEach((d) => d.exercises.forEach((e) => { if (e.alias) m[nameKey(e.alias)] = e.exerciseId; }));
  return m;
})();

export function readLegacyFromBrowser(readLegacy) {
  const routines = readLegacy(LEGACY_KEYS.routines);
  const sessions = readLegacy(LEGACY_KEYS.sessions);
  if (!routines && !sessions) return null;
  return {
    routines: routines || {},
    slotMap: readLegacy(LEGACY_KEYS.slots) || {},
    sessions: Array.isArray(sessions) ? sessions : [],
    settings: readLegacy(LEGACY_KEYS.settings) || {},
  };
}

export function isLegacyBackup(obj) {
  return obj && typeof obj === "object" && !obj.version && (obj.slotMap || (obj.routines && !Array.isArray(obj.routines)));
}

/**
 * @param legacy  { routines: {nombre: [{name, muscle}]}, slotMap, sessions, settings }
 * @param catalogIds Set con los ids de ejercicios existentes
 * @returns { routine, sessions, customExercises, settings }
 */
export function convertLegacy(legacy, catalogIds) {
  const customExercises = [];
  const customByKey = {};

  const resolveExercise = (oldName, oldMuscle) => {
    const display = renameLegacy(oldName);
    const fromAlias = ALIAS_TO_ID[nameKey(display)];
    if (fromAlias && catalogIds.has(fromAlias)) return { exerciseId: fromAlias, alias: display };
    const k = nameKey(display);
    if (!customByKey[k]) {
      const muscle = legacyMuscleToId(oldMuscle || "");
      const ex = {
        id: "custom-" + slugify(display) + "-" + Math.random().toString(36).slice(2, 6),
        name: display,
        muscle,
        pattern: PATTERN_BY_MUSCLE[muscle] || "core",
        equipment: "maquina",
        home: false,
        video: null,
        source: "custom",
        tags: [],
      };
      customExercises.push(ex);
      customByKey[k] = ex.id;
    }
    return { exerciseId: customByKey[k], alias: null };
  };

  // Orden de días: primero los asignados a PUSH/PULL/ARM/LEG, luego el resto
  const names = Object.keys(legacy.routines || {});
  const ordered = [
    ...SLOT_ORDER.map((s) => legacy.slotMap?.[s]).filter((n) => n && names.includes(n)),
  ];
  names.forEach((n) => { if (!ordered.includes(n)) ordered.push(n); });

  const days = ordered.map((dayName) => {
    const items = (legacy.routines[dayName] || []).map((it) => {
      const name = typeof it === "string" ? it : it.name;
      const muscle = typeof it === "string" ? "" : it.muscle;
      const { exerciseId, alias } = resolveExercise(name, muscle);
      return { id: uid("it"), exerciseId, alias, sets: 3, reps: "8-12" };
    });
    const focus = [...new Set(items.map((i) => {
      const c = customExercises.find((x) => x.id === i.exerciseId);
      return c ? c.muscle : null;
    }).filter(Boolean))];
    return { id: uid("day"), name: dayName, focus, exercises: items };
  });

  const routine = {
    id: uid("rt"),
    name: "Mi rutina (versión anterior)",
    templateId: null,
    description: "Importada automáticamente desde la versión anterior de Crasher.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    days,
  };

  const dayByName = Object.fromEntries(days.map((d) => [nameKey(d.name), d]));
  const sessions = (legacy.sessions || []).map((s) => {
    const dayName = s.routine || legacy.slotMap?.[s.slot] || s.slot || "Sesión";
    const day = dayByName[nameKey(dayName)];
    return {
      id: s.id || uid("ses"),
      date: s.date,
      createdAt: Date.parse(s.date) || Date.now(),
      routineId: routine.id,
      routineName: routine.name,
      dayId: day?.id || null,
      dayName,
      notes: s.notes || "",
      exercises: (s.exercises || []).map((e) => ({
        exerciseId: resolveExercise(e.name, e.muscle).exerciseId,
        name: renameLegacy(e.name),
        muscle: legacyMuscleToId(e.muscle || ""),
        note: e.note || "",
        sets: (e.sets || []).map((st) => ({
          weight: Number(st.weight) || 0,
          reps: Number(st.reps) || 0,
          rir: st.rir ?? null,
          rpe: st.rpe ?? null,
        })),
      })),
    };
  });

  const settings = {};
  const old = legacy.settings || {};
  if ("showRIR" in old) settings.showRIR = !!old.showRIR;
  if ("showRPE" in old) settings.showRPE = !!old.showRPE;
  if ("showExNotes" in old) settings.showNotes = !!old.showExNotes;
  if ("showSetHints" in old) settings.showHints = !!old.showSetHints;

  return { routine, sessions, customExercises, settings };
}
