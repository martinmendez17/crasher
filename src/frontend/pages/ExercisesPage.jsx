// Catálogo completo de ejercicios.

import { useData } from "../store.jsx";
import { ExerciseBrowser } from "../components/ExerciseBrowser.jsx";
import { Icon } from "../icons.jsx";

export function ExercisesPage() {
  const { exercises, api, run, confirm } = useData();
  const fromBook = exercises.filter((e) => e.source === "enciclopedia").length;

  return (
    <>
      <p className="hint page-lead">
        {exercises.length} ejercicios. {fromBook} vienen de la Enciclopedia de Ejercicios de Manuel Escalera y tienen
        video de técnica; toca <Icon name="play" width={16} height={16} className="inline-icon" /> para verlo.
      </p>
      <ExerciseBrowser
        renderActions={(ex) =>
          ex.source === "custom" ? (
            <button
              className="icon-btn sm"
              aria-label={`Eliminar ${ex.name}`}
              title="Eliminar"
              onClick={async () => {
                const ok = await confirm({
                  title: `¿Eliminar “${ex.name}”?`,
                  message: "Se quita del catálogo. Los entrenamientos ya registrados con este ejercicio se mantienen.",
                  confirmLabel: "Eliminar",
                  danger: true,
                });
                if (ok) run(() => api.exercises.remove(ex.id), "Ejercicio eliminado");
              }}
            >
              <Icon name="trash" />
            </button>
          ) : null
        }
      />
    </>
  );
}
