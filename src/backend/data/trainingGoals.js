// Objetivos de entrenamiento según carga y repeticiones.
// Fuente: tabla de objetivos (fuerza máxima, hipertrofia, fuerza-resistencia).
// La potencia no se considera en esta app.

export const GOALS = {
  fuerza: {
    id: "fuerza",
    label: "Fuerza máxima",
    short: "Fuerza",
    load: "Alta (1-6 RM)",
    reps: [1, 6],
    repsText: "1-6",
    defaultReps: "3-6",
    tip: "Pesos altos y pocas repeticiones. Descansa más entre series (2-5 min).",
  },
  hipertrofia: {
    id: "hipertrofia",
    label: "Hipertrofia",
    short: "Hipertrofia",
    load: "Moderada (6-12 RM, dentro de un rango de 1-12 RM)",
    reps: [6, 12],
    repsText: "6-12",
    defaultReps: "6-12",
    tip: "Carga moderada cerca del fallo. Es el rango para ganar masa muscular.",
  },
};

export const GOAL_LIST = [GOALS.fuerza, GOALS.hipertrofia];
export const DEFAULT_GOAL = "hipertrofia";

// Sobre este número de repeticiones el trabajo pasa a ser fuerza-resistencia
// (carga ligera-moderada, 40-60 % 1RM): no sirve para ganar fuerza ni músculo.
export const REPS_ALERT = 15;
export const REPS_ALERT_MESSAGE = "No vas a progresar, skinny.";
export const REPS_ALERT_HELP = "Más de 15 repeticiones es fuerza-resistencia: sube el peso.";

// Ejercicios de core como la plancha se miden en segundos, no en repeticiones.
export function repsAlertApplies(muscle) {
  return muscle !== "core";
}

/** Clasifica un rango de repeticiones ("8-12") según la tabla. */
export function classifyReps(reps) {
  const nums = String(reps || "").match(/\d+/g)?.map(Number) || [];
  if (!nums.length) return null;
  const max = Math.max(...nums.slice(0, 2));
  if (max <= 6) return "fuerza";
  if (max <= 12) return "hipertrofia";
  if (max <= REPS_ALERT) return "alto";
  return "resistencia";
}

export const REP_CLASS_LABEL = {
  fuerza: "Fuerza",
  hipertrofia: "Hipertrofia",
  alto: "Hipertrofia (reps altas)",
  resistencia: "Fuerza-resistencia",
};
