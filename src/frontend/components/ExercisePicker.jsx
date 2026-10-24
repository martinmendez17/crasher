import { Sheet } from "./Sheet.jsx";
import { ExerciseBrowser } from "./ExerciseBrowser.jsx";

export function ExercisePicker({ title = "Agregar ejercicio", initialMuscles = [], onPick, onClose, pickLabel }) {
  return (
    <Sheet title={title} onClose={onClose}>
      <ExerciseBrowser initialMuscles={initialMuscles} onPick={onPick} pickLabel={pickLabel} />
    </Sheet>
  );
}
