// Referencias de volumen de entrenamiento por grupo muscular (series efectivas por semana).
// Basadas en los "volume landmarks" de Renaissance Periodization (Mike Israetel):
//   MV  — volumen de mantenimiento: lo mínimo para no perder músculo.
//   MEV — mínimo volumen efectivo: desde aquí empiezas a ganar músculo.
//   MAV — máximo volumen adaptativo: el rango donde más se progresa.
//   MRV — máximo volumen recuperable: sobre esto ya no te recuperas (sobrefatiga).
// Los rangos son [mínimo, máximo]. mrv es el valor desde el que se considera excesivo.
// "Aductores" no aparece en la tabla original, por eso no tiene referencia.

export const VOLUME_SOURCE =
  "Volume landmarks de Renaissance Periodization (Dr. Mike Israetel). Son promedios para personas con algo de experiencia: tus valores pueden variar.";

export const LANDMARKS = {
  cuadriceps: { mv: [6, 6], mev: [8, 12], mav: [12, 18], mrv: 20, freq: [1.5, 3], reps: "6-20", rir: "1-3" },
  isquios: { mv: [4, 4], mev: [6, 10], mav: [10, 16], mrv: 20, freq: [2, 3], reps: "6-20", rir: "1-3" },
  gluteos: { mv: [0, 0], mev: [0, 4], mav: [4, 12], mrv: 16, freq: [2, 3], reps: "6-20", rir: "1-3" },
  pecho: { mv: [8, 8], mev: [10, 12], mav: [12, 20], mrv: 22, freq: [2, 4], reps: "4-20", rir: "1-3" },
  espalda: { mv: [8, 8], mev: [10, 14], mav: [14, 22], mrv: 25, freq: [2, 4], reps: "6-20", rir: "1-3" },
  hombros: { mv: [0, 6], mev: [6, 8], mav: [16, 22], mrv: 26, freq: [2, 6], reps: "8-20", rir: "0-2" },
  biceps: { mv: [0, 6], mev: [8, 14], mav: [14, 20], mrv: 26, freq: [2, 6], reps: "8-15", rir: "0-2" },
  triceps: { mv: [0, 4], mev: [6, 10], mav: [10, 14], mrv: 18, freq: [2, 4], reps: "8-20", rir: "0-2" },
  trapecio: { mv: [0, 0], mev: [1, 12], mav: [12, 20], mrv: 26, freq: [2, 6], reps: "8-20", rir: "0-2" },
  gemelos: { mv: [0, 6], mev: [8, 12], mav: [12, 16], mrv: 20, freq: [2, 4], reps: "8-20", rir: "0-2" },
  core: { mv: [0, 0], mev: [1, 15], mav: [16, 20], mrv: 25, freq: [2, 6], reps: "8-20", rir: "0-2" },
};

/** Texto de un rango: [8, 12] -> "8-12"; [6, 6] -> "6". */
export function rangeText([a, b]) {
  return a === b ? String(a) : `${a}-${b}`;
}

export function freqText([a, b]) {
  const f = (x) => String(x).replace(".", ",");
  return `${f(a)}-${f(b)} veces`;
}
