// Modelos de entrenamiento base.
// Son plantillas de solo lectura: cuando el usuario elige una, el backend crea
// una copia editable en "Mis rutinas" (ver api/routines.js).
//
// goal (por día): "fuerza" o "hipertrofia" (ver data/trainingGoals.js).
// cyclesPerWeek: cuántas veces por semana se completa el ciclo de días
// (se usa para estimar el volumen semanal planificado).
//
// Formato de cada ejercicio: e(idDelCatalogo, series, rangoDeReps, opciones)
//   opciones.alias -> nombre que se muestra en vez del nombre del catálogo
//   opciones.note  -> indicación corta (superserie, al fallo, etc.)

const e = (exerciseId, sets, reps, opts = {}) => ({ exerciseId, sets, reps, ...opts });

export const TEMPLATES = [
  {
    id: "ppl",
    cyclesPerWeek: 1,
    name: "Push / Pull / Legs",
    daysPerWeek: "3 o 6 días",
    level: "Intermedio",
    summary: "Separa los músculos por movimiento: empujar, tirar y pierna.",
    description:
      "Cada día trabaja los músculos que colaboran en el mismo patrón de movimiento. Hazlo 3 días por semana para empezar, o repite el ciclo dos veces (6 días) para entrenar cada músculo con frecuencia 2.",
    schedule: "Lun Push · Mar Pull · Mié Legs · (repite o descansa)",
    days: [
      {
        name: "Push",
        goal: "hipertrofia",
        focus: ["pecho", "hombros", "triceps"],
        exercises: [
          e("press-banca-con-barra", 4, "6-8"),
          e("press-inclinado-con-mancuernas", 3, "8-10"),
          e("press-militar-para-hombro", 3, "8-10"),
          e("elevaciones-laterales-con-mancuernas", 3, "12-15"),
          e("triceps-polea-alta-con-cuerda", 3, "10-12"),
          e("press-frances-con-barra-ez-para-triceps", 3, "10-12"),
        ],
      },
      {
        name: "Pull",
        goal: "hipertrofia",
        focus: ["espalda", "biceps", "hombros"],
        exercises: [
          e("dominadas", 3, "6-10"),
          e("remo-con-barra", 3, "8-10"),
          e("remo-gironda", 3, "10-12"),
          e("face-pull-con-cuerda-desde-polea-alta", 3, "12-15"),
          e("curl-biceps-con-barra-de-pie", 3, "8-12"),
          e("curl-biceps-con-mancuernas-tipo-martillo", 3, "10-12"),
        ],
      },
      {
        name: "Legs",
        goal: "hipertrofia",
        focus: ["cuadriceps", "isquios", "gluteos", "gemelos"],
        exercises: [
          e("sentadilla-con-barra", 4, "6-8"),
          e("peso-muerto-rumano-con-barra", 3, "8-10"),
          e("prensa-inclinada", 3, "10-12"),
          e("femoral-maquina-tumbada", 3, "10-12"),
          e("cuadriceps-en-maquina", 3, "12-15"),
          e("elevaciones-de-talones-en-maquina-de-pie", 4, "10-15"),
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    cyclesPerWeek: 1,
    name: "Upper / Lower",
    daysPerWeek: "4 días",
    level: "Principiante a intermedio",
    summary: "Torso y pierna alternados, cada músculo dos veces por semana.",
    description:
      "Dos días de torso y dos de pierna. Los días A priorizan fuerza (menos repeticiones, más peso) y los días B priorizan hipertrofia (más repeticiones).",
    schedule: "Lun Upper A · Mar Lower A · Jue Upper B · Vie Lower B",
    days: [
      {
        name: "Upper A · Fuerza",
        goal: "fuerza",
        focus: ["pecho", "espalda", "hombros", "biceps", "triceps"],
        exercises: [
          e("press-banca-con-barra", 4, "4-6"),
          e("remo-con-barra", 4, "4-6"),
          e("press-militar-para-hombro", 3, "4-6"),
          e("jalon-al-pecho-agarre-neutro", 3, "8-10"),
          e("curl-biceps-con-barra-de-pie", 2, "8-10"),
          e("triceps-polea-alta-con-barra", 2, "8-10"),
        ],
      },
      {
        name: "Lower A · Fuerza",
        goal: "fuerza",
        focus: ["cuadriceps", "isquios", "gluteos", "gemelos", "core"],
        exercises: [
          e("sentadilla-con-barra", 4, "3-5"),
          e("peso-muerto-rumano-con-barra", 3, "4-6"),
          e("prensa-horizontal", 3, "8-10"),
          e("femoral-maquina-tumbada", 3, "8-10"),
          e("elevaciones-de-talones-en-maquina-de-pie", 4, "8-12"),
          e("plancha-abdominal", 3, "30-45 s"),
        ],
      },
      {
        name: "Upper B · Hipertrofia",
        goal: "hipertrofia",
        focus: ["pecho", "espalda", "hombros", "biceps", "triceps"],
        exercises: [
          e("press-inclinado-con-mancuernas", 3, "8-12"),
          e("remo-con-mancuerna-a-un-brazo", 3, "10-12"),
          e("cruce-de-poleas-para-pecho", 3, "12-15"),
          e("jalon-al-pecho-agarre-ancho-y-prono", 3, "10-12"),
          e("elevaciones-laterales-con-mancuernas", 3, "12-15"),
          e("curl-inclinado-con-mancuernas", 3, "10-12"),
          e("triceps-polea-alta-con-cuerda-por-encima-de-la-cabeza", 3, "10-12"),
        ],
      },
      {
        name: "Lower B · Hipertrofia",
        goal: "hipertrofia",
        focus: ["gluteos", "cuadriceps", "isquios", "gemelos"],
        exercises: [
          e("hip-thrust-con-barra", 4, "8-10"),
          e("sentadilla-en-maquina-hack", 3, "8-12"),
          e("zancada-bulgara-con-mancuerna", 3, "10-12"),
          e("femoral-sentado-en-maquina", 3, "10-12"),
          e("cuadriceps-en-maquina", 3, "12-15"),
          e("gemelos-sentada-en-maquina", 3, "12-15"),
        ],
      },
    ],
  },
  {
    id: "heavy-duty",
    cyclesPerWeek: 0.5,
    name: "Heavy Duty",
    daysPerWeek: "3 días rotativos",
    level: "Avanzado",
    summary: "Método de Mike Mentzer: pocas series, llevadas al fallo real.",
    description:
      "Tras calentar, haz una sola serie efectiva por ejercicio hasta el fallo muscular, con técnica estricta y bajada lenta. Descansa de 4 a 7 días entre entrenamientos: el progreso depende de recuperarse por completo.",
    schedule: "Día 1 → descanso 4-7 días → Día 2 → descanso → Día 3",
    days: [
      {
        name: "Pecho y espalda",
        goal: "hipertrofia",
        focus: ["pecho", "espalda"],
        exercises: [
          e("contractor-de-pecho-pec-deck", 1, "6-10", { note: "Superserie con el siguiente, sin descanso" }),
          e("press-inclinado-en-multipower", 1, "1-3", { note: "Inmediatamente después del pec deck" }),
          e("pullover-cuerda-polea-alta", 1, "6-10", { note: "Superserie con el siguiente" }),
          e("jalon-al-pecho-agarre-cerrado-supino", 1, "6-10"),
          e("peso-muerto-convencional", 1, "5-8", { note: "Una serie al fallo técnico" }),
        ],
      },
      {
        name: "Piernas",
        goal: "hipertrofia",
        focus: ["cuadriceps", "isquios", "gemelos"],
        exercises: [
          e("cuadriceps-en-maquina", 1, "8-15", { note: "Superserie con la prensa" }),
          e("prensa-inclinada", 1, "8-15"),
          e("femoral-maquina-tumbada", 1, "6-10"),
          e("elevaciones-de-talones-en-maquina-de-pie", 1, "10-15"),
        ],
      },
      {
        name: "Hombros y brazos",
        goal: "hipertrofia",
        focus: ["hombros", "biceps", "triceps"],
        exercises: [
          e("elevaciones-laterales-con-mancuernas", 1, "6-10"),
          e("pajaros-en-maquina", 1, "6-10"),
          e("curl-biceps-con-barra-de-pie", 1, "6-10"),
          e("triceps-polea-alta-con-barra", 1, "6-10", { note: "Superserie con fondos" }),
          e("fondos-para-triceps", 1, "3-5"),
        ],
      },
    ],
  },
  {
    id: "full-body",
    cyclesPerWeek: 1,
    name: "Full Body",
    daysPerWeek: "3 días",
    level: "Principiante",
    summary: "Todo el cuerpo en cada sesión, ideal para empezar.",
    description:
      "Tres sesiones distintas que trabajan el cuerpo completo. Entrena en días no consecutivos para recuperarte entre sesiones.",
    schedule: "Lun A · Mié B · Vie C",
    days: [
      {
        name: "Full Body A",
        goal: "hipertrofia",
        focus: ["cuadriceps", "pecho", "espalda", "hombros", "biceps", "core"],
        exercises: [
          e("sentadilla-con-barra", 3, "6-8"),
          e("press-banca-con-barra", 3, "6-8"),
          e("remo-con-barra", 3, "8-10"),
          e("elevaciones-laterales-con-mancuernas", 2, "12-15"),
          e("curl-biceps-con-mancuernas", 2, "10-12"),
          e("plancha-abdominal", 3, "30-45 s"),
        ],
      },
      {
        name: "Full Body B",
        goal: "hipertrofia",
        focus: ["isquios", "hombros", "espalda", "cuadriceps", "triceps", "core"],
        exercises: [
          e("peso-muerto-rumano-con-barra", 3, "8-10"),
          e("press-militar-para-hombro", 3, "6-8"),
          e("jalon-al-pecho-agarre-neutro", 3, "8-10"),
          e("zancadas-estaticas", 2, "10-12"),
          e("triceps-polea-alta-con-cuerda", 2, "10-12"),
          e("crunch-en-polea-alta", 3, "12-15"),
        ],
      },
      {
        name: "Full Body C",
        goal: "hipertrofia",
        focus: ["gluteos", "pecho", "espalda", "cuadriceps", "hombros", "gemelos"],
        exercises: [
          e("hip-thrust-con-barra", 3, "8-10"),
          e("press-inclinado-con-mancuernas", 3, "8-10"),
          e("remo-gironda", 3, "10-12"),
          e("prensa-horizontal", 3, "10-12"),
          e("face-pull-con-cuerda-desde-polea-alta", 2, "12-15"),
          e("elevaciones-de-talones-de-pie", 3, "12-15"),
        ],
      },
    ],
  },
  {
    id: "arnold",
    cyclesPerWeek: 2,
    name: "Arnold Split",
    daysPerWeek: "6 días",
    level: "Avanzado",
    summary: "La división de Arnold Schwarzenegger: alto volumen, frecuencia 2.",
    description:
      "Combina músculos antagonistas (pecho con espalda, bíceps con tríceps) y repite el ciclo de 3 días dos veces por semana. Exige buena recuperación.",
    schedule: "Pecho/Espalda · Hombros/Brazos · Piernas · (repite)",
    days: [
      {
        name: "Pecho y espalda",
        goal: "hipertrofia",
        focus: ["pecho", "espalda"],
        exercises: [
          e("press-banca-con-barra", 4, "6-10"),
          e("dominadas", 4, "6-10"),
          e("press-inclinado-con-mancuernas", 3, "8-12"),
          e("remo-con-barra", 3, "8-10"),
          e("aperturas-con-mancuernas", 3, "10-12"),
          e("pullover-con-mancuerna", 3, "10-12"),
        ],
      },
      {
        name: "Hombros y brazos",
        goal: "hipertrofia",
        focus: ["hombros", "biceps", "triceps", "antebrazo"],
        exercises: [
          e("press-militar-para-hombro", 4, "6-10"),
          e("elevaciones-laterales-con-mancuernas", 4, "10-15"),
          e("pajaros-con-mancuernas-tumbado-en-banco-inclinado", 3, "12-15"),
          e("curl-biceps-con-barra-de-pie", 3, "8-10"),
          e("press-frances-con-barra-ez-para-triceps", 3, "8-10"),
          e("curl-biceps-concentrado-a-una-mano", 3, "10-12"),
          e("triceps-polea-alta-con-cuerda", 3, "10-12"),
          e("curl-de-muneca-con-barra", 3, "10-15"),
        ],
      },
      {
        name: "Piernas",
        goal: "hipertrofia",
        focus: ["cuadriceps", "isquios", "gemelos", "core"],
        exercises: [
          e("sentadilla-con-barra", 4, "6-10"),
          e("peso-muerto-rumano-con-barra", 3, "8-10"),
          e("prensa-inclinada", 3, "10-12"),
          e("femoral-maquina-tumbada", 3, "10-12"),
          e("elevaciones-de-talones-en-maquina-de-pie", 4, "12-15"),
          e("rueda-abdominal", 3, "8-12"),
        ],
      },
    ],
  },
  {
    id: "weider",
    cyclesPerWeek: 1,
    name: "Weider (un músculo por día)",
    daysPerWeek: "5 días",
    level: "Intermedio",
    summary: "La clásica rutina de gimnasio: cada día un grupo muscular.",
    description:
      "Mucho volumen por músculo en una sola sesión semanal. Fácil de organizar y de seguir; si buscas más frecuencia, prueba Upper / Lower o Push / Pull / Legs.",
    schedule: "Lun Pecho · Mar Espalda · Mié Piernas · Jue Hombros · Vie Brazos",
    days: [
      {
        name: "Pecho",
        goal: "hipertrofia",
        focus: ["pecho"],
        exercises: [
          e("press-banca-con-barra", 4, "6-10"),
          e("press-inclinado-con-mancuernas", 3, "8-12"),
          e("press-de-pecho-en-maquina", 3, "10-12"),
          e("cruce-de-poleas-para-pecho", 3, "12-15"),
          e("fondos-en-paralelas-para-pecho", 2, "8-12"),
        ],
      },
      {
        name: "Espalda",
        goal: "hipertrofia",
        focus: ["espalda", "trapecio"],
        exercises: [
          e("dominadas", 4, "6-10"),
          e("remo-con-barra", 4, "8-10"),
          e("jalon-al-pecho-agarre-neutro", 3, "10-12"),
          e("remo-con-mancuerna-a-un-brazo", 3, "10-12"),
          e("pullover-cuerda-polea-alta", 3, "12-15"),
          e("encogimientos-con-mancuernas", 3, "10-15"),
          e("elevaciones-y-en-banco-inclinado", 2, "10-12"),
        ],
      },
      {
        name: "Piernas",
        goal: "hipertrofia",
        focus: ["cuadriceps", "isquios", "gluteos", "gemelos"],
        exercises: [
          e("sentadilla-con-barra", 4, "6-10"),
          e("prensa-inclinada", 3, "10-12"),
          e("peso-muerto-rumano-con-barra", 3, "8-10"),
          e("zancada-bulgara-con-mancuerna", 3, "10-12"),
          e("femoral-maquina-tumbada", 3, "10-12"),
          e("elevaciones-de-talones-en-maquina-de-pie", 4, "12-15"),
        ],
      },
      {
        name: "Hombros",
        goal: "hipertrofia",
        focus: ["hombros"],
        exercises: [
          e("press-militar-para-hombro", 4, "6-10"),
          e("press-arnold-con-mancuernas", 3, "8-12"),
          e("elevaciones-laterales-con-mancuernas", 4, "12-15"),
          e("elevaciones-laterales-a-un-brazo-desde-polea-baja", 3, "12-15"),
          e("face-pull-con-cuerda-desde-polea-alta", 3, "12-15"),
        ],
      },
      {
        name: "Brazos",
        goal: "hipertrofia",
        focus: ["biceps", "triceps", "antebrazo"],
        exercises: [
          e("curl-biceps-con-barra-de-pie", 3, "8-10"),
          e("press-banca-agarre-cerrado", 3, "6-10"),
          e("curl-inclinado-con-mancuernas", 3, "10-12"),
          e("triceps-polea-alta-con-cuerda-por-encima-de-la-cabeza", 3, "10-12"),
          e("curl-biceps-con-mancuernas-tipo-martillo", 3, "10-12"),
          e("triceps-polea-alta-con-cuerda", 3, "12-15"),
          e("curl-inverso-con-barra-ez", 3, "10-12"),
          e("curl-de-muneca-con-barra", 3, "10-15"),
        ],
      },
    ],
  },
  {
    id: "crasher-ppal",
    cyclesPerWeek: 1,
    name: "Push / Pull / Arm / Leg",
    daysPerWeek: "4 días",
    level: "Intermedio",
    summary: "La rutina original de Crasher, con días de brazo y unilaterales.",
    description:
      "Push / Pull / Legs con un día extra para hombro y brazos. Varios ejercicios se hacen a un brazo, por eso aparecen por separado el lado derecho y el izquierdo.",
    schedule: "Push · Pull · Arm · Leg",
    days: [
      {
        name: "Push",
        goal: "hipertrofia",
        focus: ["pecho", "hombros", "triceps"],
        exercises: [
          e("elevaciones-laterales-a-un-brazo-desde-polea-baja", 3, "8-12", { alias: "Lateral polea (derecha)" }),
          e("elevaciones-laterales-a-un-brazo-desde-polea-baja", 3, "8-12", { alias: "Lateral polea (izquierda)" }),
          e("elevaciones-laterales-con-mancuernas", 3, "8-12", { alias: "Laterales con mancuernas" }),
          e("press-banca-con-barra", 3, "8-12", { alias: "Press banca plano" }),
          e("press-banca-inclinado-con-barra", 3, "8-12", { alias: "Press banca inclinado" }),
          e("press-militar-para-hombro", 3, "8-12", { alias: "Press militar" }),
          e("triceps-polea-alta-a-un-brazo", 3, "8-12", { alias: "Tríceps polea (derecha)" }),
          e("triceps-polea-alta-a-un-brazo", 3, "8-12", { alias: "Tríceps polea (izquierda)" }),
        ],
      },
      {
        name: "Pull",
        goal: "hipertrofia",
        focus: ["espalda", "trapecio", "biceps", "hombros"],
        exercises: [
          e("jalon-al-pecho-agarre-neutro", 3, "8-12", { alias: "Jalón unilateral (derecho)" }),
          e("jalon-al-pecho-agarre-neutro", 3, "8-12", { alias: "Jalón unilateral (izquierdo)" }),
          e("remo-con-pecho-apoyado-seal-row", 3, "8-12", { alias: "Seal row" }),
          e("remo-con-barra", 3, "8-12", { alias: "Remo" }),
          e("encogimientos-con-mancuernas", 3, "8-12", { alias: "Trapecio" }),
          e("cruce-de-poleas-para-hombro-posterior", 3, "8-12", { alias: "Deltoide posterior (derecho)" }),
          e("cruce-de-poleas-para-hombro-posterior", 3, "8-12", { alias: "Deltoide posterior (izquierdo)" }),
          e("curl-biceps-con-mancuernas", 3, "8-12", { alias: "Bíceps" }),
        ],
      },
      {
        name: "Arm",
        goal: "hipertrofia",
        focus: ["hombros", "biceps", "triceps"],
        exercises: [
          e("elevaciones-laterales-a-un-brazo-desde-polea-baja", 3, "8-12", { alias: "Deltoide lateral (derecho)" }),
          e("elevaciones-laterales-a-un-brazo-desde-polea-baja", 3, "8-12", { alias: "Deltoide lateral (izquierdo)" }),
          e("elevaciones-laterales-con-mancuernas", 3, "8-12", { alias: "Deltoide con mancuerna" }),
          e("cruce-de-poleas-para-hombro-posterior", 3, "8-12", { alias: "Deltoide posterior brazo (izquierdo)" }),
          e("cruce-de-poleas-para-hombro-posterior", 3, "8-12", { alias: "Deltoide posterior brazo (derecho)" }),
          e("triceps-polea-alta-con-cuerda", 3, "8-12", { alias: "Tríceps" }),
          e("curl-biceps-con-barra-de-pie", 3, "8-12", { alias: "Bíceps" }),
          e("press-de-pecho-en-maquina", 3, "8-12", { alias: "Pecho" }),
          e("remo-con-pecho-apoyado-seal-row", 3, "8-12", { alias: "Seal row" }),
        ],
      },
      {
        name: "Leg",
        goal: "hipertrofia",
        focus: ["cuadriceps", "gluteos", "isquios", "aductores", "core"],
        exercises: [
          e("sentadilla-en-maquina-hack", 3, "8-12", { alias: "Hack" }),
          e("hip-thrust-con-barra", 3, "8-12", { alias: "Hip thrust" }),
          e("cuadriceps-en-maquina", 3, "8-12", { alias: "Extensión de cuádriceps" }),
          e("femoral-maquina-tumbada", 3, "8-12", { alias: "Curl femoral" }),
          e("maquina-de-abductores", 3, "8-12", { alias: "Abductor" }),
          e("aductor-en-maquina-sentada", 3, "8-12", { alias: "Aductor" }),
          e("crunch-en-polea-alta", 3, "8-12", { alias: "Abdominales" }),
        ],
      },
    ],
  },
];

// Nombres que usaba la versión anterior (index.html único) -> nombres nuevos.
// Se usan al migrar el historial guardado en el navegador para no perder
// la referencia de "semana anterior" en cada ejercicio.
export const LEGACY_NAME_MAP = {
  "lateral pol der": "Lateral polea (derecha)",
  "lateral pol izq": "Lateral polea (izquierda)",
  "laterales mancu": "Laterales con mancuernas",
  "triceps der": "Tríceps polea (derecha)",
  "triceps izq": "Tríceps polea (izquierda)",
  "lat der": "Jalón unilateral (derecho)",
  "lat izq": "Jalón unilateral (izquierdo)",
  "seal row": "Seal row",
  "trap": "Trapecio",
  "delt der": "Deltoide posterior (derecho)",
  "delt izq": "Deltoide posterior (izquierdo)",
  "biceps": "Bíceps",
  "side delt der": "Deltoide lateral (derecho)",
  "side delt izq": "Deltoide lateral (izquierdo)",
  "mancuerna delt": "Deltoide con mancuerna",
  "rear del izq": "Deltoide posterior brazo (izquierdo)",
  "rear del der": "Deltoide posterior brazo (derecho)",
  "pecho": "Pecho",
  "hack": "Hack",
  "hip trust": "Hip thrust",
  "extension cua": "Extensión de cuádriceps",
  "flexion isq": "Curl femoral",
  "abductor": "Abductor",
  "aductor": "Aductor",
  "abs": "Abdominales",
};

// Slot de la versión anterior -> índice de día en la plantilla crasher-ppal
export const LEGACY_SLOT_TO_DAY = { PUSH: 0, PULL: 1, ARM: 2, LEG: 3 };
