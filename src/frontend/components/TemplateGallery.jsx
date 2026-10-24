// Lista de modelos de entrenamiento con vista previa de sus días.

import { useState } from "react";
import { useData } from "../store.jsx";
import { Plate } from "./Plate.jsx";
import { Icon } from "../icons.jsx";
import { MUSCLE_LABEL } from "../../backend/data/catalogs.js";
import { navigate } from "../router.jsx";

export function TemplateGallery({ goToEditor = true }) {
  const { templates, exById, api, run } = useData();
  const [open, setOpen] = useState(null);

  const use = async (t) => {
    const r = await run(() => api.routines.createFromTemplate(t.id), `“${t.name}” agregado a tus rutinas`);
    if (r && goToEditor) navigate(`/rutinas/${r.id}`);
  };

  return (
    <div className="templates">
      {templates.map((t) => {
        const isOpen = open === t.id;
        return (
          <article key={t.id} className="template">
            <div className="template-head">
              <div className="template-plates" aria-hidden="true">
                {t.days.map((_, i) => (
                  <Plate key={i} index={i} size={22} />
                ))}
              </div>
              <h3>{t.name}</h3>
              <p className="template-meta">
                {t.daysPerWeek} · {t.level}
              </p>
              <p>{t.summary}</p>
            </div>

            {isOpen && (
              <div className="template-detail">
                <p className="hint">{t.description}</p>
                <p className="hint">
                  <strong>Semana tipo:</strong> {t.schedule}
                </p>
                {t.days.map((d, i) => (
                  <div key={i} className="template-day">
                    <div className="template-day-name">
                      <Plate index={i} size={20} />
                      <strong>{d.name}</strong>
                      <span className="hint">{d.focus.map((m) => MUSCLE_LABEL[m]).join(", ")}</span>
                    </div>
                    <ul>
                      {d.exercises.map((e, j) => (
                        <li key={j}>
                          <span>{e.alias || exById.get(e.exerciseId)?.name}</span>
                          <span className="num">
                            {e.sets} × {e.reps}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => use(t)}>
                Usar este modelo
              </button>
              <button className="btn" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen}>
                {isOpen ? "Ocultar ejercicios" : "Ver ejercicios"}
                <Icon name={isOpen ? "up" : "down"} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
