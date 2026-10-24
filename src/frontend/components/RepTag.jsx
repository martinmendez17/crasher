// Etiqueta que clasifica un rango de repeticiones según el objetivo (fuerza / hipertrofia)
// y la alerta cuando se pasa de 15 repeticiones.

import { Icon } from "../icons.jsx";
import { classifyReps, repsAlertApplies, REP_CLASS_LABEL, REPS_ALERT_MESSAGE } from "../../backend/data/trainingGoals.js";

const TONE = { fuerza: "goal-fuerza", hipertrofia: "goal-hipertrofia", alto: "warning", resistencia: "danger" };

export function RepTag({ reps, muscle }) {
  if (!repsAlertApplies(muscle)) return null;
  const c = classifyReps(reps);
  if (!c) return null;
  if (c === "resistencia") {
    return (
      <span className="badge danger rep-alert" role="alert">
        <Icon name="alert" /> Más de 15 reps: {REPS_ALERT_MESSAGE.toLowerCase()}
      </span>
    );
  }
  return <span className={`badge ${TONE[c]}`}>{REP_CLASS_LABEL[c]}</span>;
}
