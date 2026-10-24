// Catálogos fijos usados por backend y frontend.

export const MUSCLES = [
  { id: "pecho", label: "Pecho" },
  { id: "espalda", label: "Espalda" },
  { id: "trapecio", label: "Trapecio" },
  { id: "hombros", label: "Hombros" },
  { id: "biceps", label: "Bíceps" },
  { id: "triceps", label: "Tríceps" },
  { id: "cuadriceps", label: "Cuádriceps" },
  { id: "isquios", label: "Isquiotibiales" },
  { id: "gluteos", label: "Glúteos" },
  { id: "aductores", label: "Aductores" },
  { id: "gemelos", label: "Gemelos" },
  { id: "core", label: "Core" },
];

export const EQUIPMENT = [
  { id: "barra", label: "Barra" },
  { id: "mancuernas", label: "Mancuernas" },
  { id: "maquina", label: "Máquina" },
  { id: "polea", label: "Polea" },
  { id: "multipower", label: "Multipower" },
  { id: "goma", label: "Goma elástica" },
  { id: "disco", label: "Disco" },
  { id: "peso-corporal", label: "Peso corporal" },
];

export const PATTERNS = [
  { id: "empuje", label: "Empuje" },
  { id: "tiron", label: "Tirón" },
  { id: "pierna", label: "Pierna" },
  { id: "core", label: "Core" },
];

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x.label]));
export const MUSCLE_LABEL = byId(MUSCLES);
export const EQUIPMENT_LABEL = byId(EQUIPMENT);
export const PATTERN_LABEL = byId(PATTERNS);

// Patrón de movimiento por defecto según el músculo principal
export const PATTERN_BY_MUSCLE = {
  pecho: "empuje",
  hombros: "empuje",
  triceps: "empuje",
  espalda: "tiron",
  trapecio: "tiron",
  biceps: "tiron",
  cuadriceps: "pierna",
  isquios: "pierna",
  gluteos: "pierna",
  aductores: "pierna",
  gemelos: "pierna",
  core: "core",
};
