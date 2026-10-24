// Entrenar: elige el día de tu rutina activa.

import { useMemo } from "react";
import { useData } from "../store.jsx";
import { Link, navigate } from "../router.jsx";
import { Plate } from "../components/Plate.jsx";
import { TemplateGallery } from "../components/TemplateGallery.jsx";
import { Icon } from "../icons.jsx";
import { MUSCLE_LABEL } from "../../backend/data/catalogs.js";
import { relDay, plural } from "../format.js";
import { FatigueNotice } from "../components/FatigueNotice.jsx";
import { weeklyVolume, fatigueWarnings } from "../../backend/domain/volume.js";

export function TrainPage() {
  const { routines, activeRoutineId, sessions, draft, exById, api, run } = useData();
  const routine = routines.find((r) => r.id === activeRoutineId);

  const lastByDay = useMemo(() => {
    const m = {};
    if (!routine) return m;
    for (const s of sessions) {
      if (s.routineId !== routine.id || !s.dayId) continue;
      if (!m[s.dayId] || s.date > m[s.dayId].date) m[s.dayId] = s;
    }
    return m;
  }, [sessions, routine]);

  // Siguiente día sugerido: el que viene después del último entrenado
  const nextDayId = useMemo(() => {
    if (!routine?.days.length) return null;
    const entries = Object.values(lastByDay).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    if (!entries.length) return routine.days[0].id;
    const idx = routine.days.findIndex((d) => d.id === entries[0].dayId);
    return routine.days[(idx + 1) % routine.days.length].id;
  }, [lastByDay, routine]);

  // Volumen de los últimos 7 días, para avisar de sobrefatiga
  const warnings = useMemo(() => fatigueWarnings(weeklyVolume(sessions, exById, 7).sets), [sessions, exById]);
  const overMuscles = new Set(warnings.filter((w) => w.zone === "over").map((w) => w.muscle));

  if (!routines.length) {
    return (
      <>
        <div className="intro">
          <h1>Elige cómo quieres entrenar</h1>
          <p>
            Parte con un modelo de entrenamiento. Se copia a tus rutinas y puedes cambiar sus ejercicios, series y
            repeticiones cuando quieras.
          </p>
        </div>
        <TemplateGallery />
        <p className="hint center">
          ¿Prefieres partir de cero? <Link to="/rutinas">Crea una rutina vacía</Link>.
        </p>
      </>
    );
  }

  const draftDay = draft && routines.find((r) => r.id === draft.routineId)?.days.find((d) => d.id === draft.dayId);

  return (
    <>
      {draft && draftDay && (
        <div className="notice">
          <Icon name="timer" />
          <div className="grow">
            <strong>Tienes un entrenamiento sin guardar</strong>
            <div className="row-sub">{draftDay.name}</div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => navigate(`/entrenar/${draft.routineId}/${draft.dayId}`)}>
            Continuar
          </button>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="section">
          <FatigueNotice warnings={warnings} showLink />
        </div>
      )}

      <section className="section">
        <div className="routine-switch">
          <div className="grow">
            <span className="label" id="rt-label">
              Rutina activa
            </span>
            {routines.length > 1 ? (
              <select
                className="select routine-select"
                aria-labelledby="rt-label"
                value={routine?.id || ""}
                onChange={(e) => run(() => api.routines.setActive(e.target.value))}
              >
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            ) : (
              <h2>{routine?.name}</h2>
            )}
          </div>
          {routine && (
            <Link className="btn btn-sm" to={`/rutinas/${routine.id}`}>
              <Icon name="edit" /> Editar
            </Link>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>¿Qué entrenas hoy?</h2>
        </div>
        {routine && routine.days.length > 0 ? (
          <div className="days">
            {routine.days.map((d, i) => {
              const last = lastByDay[d.id];
              const isNext = d.id === nextDayId;
              const tired = [...new Set(d.exercises.map((it) => exById.get(it.exerciseId)?.muscle))].filter((m) => overMuscles.has(m));
              return (
                <button key={d.id} className={`day-card ${isNext ? "is-next" : ""}`} onClick={() => navigate(`/entrenar/${routine.id}/${d.id}`)}>
                  <Plate index={i} size={44} />
                  <span className="day-main">
                    <span className="day-name">{d.name}</span>
                    <span className="day-focus">{d.focus.map((m) => MUSCLE_LABEL[m]).join(", ") || "Sin músculos marcados"}</span>
                    <span className="day-meta">
                      {plural(d.exercises.length, "ejercicio", "ejercicios")} · {last ? `última vez ${relDay(last.date)}` : "aún sin registros"}
                    </span>
                    {tired.length > 0 && (
                      <span className="day-warn">
                        <Icon name="alert" /> {tired.map((m) => MUSCLE_LABEL[m]).join(", ")} ya {tired.length > 1 ? "pasaron su" : "pasó su"} máximo esta semana
                      </span>
                    )}
                  </span>
                  {isNext && <span className="badge success">Te toca</span>}
                  <Icon name="right" className="day-arrow" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty panel">
            <h2>Esta rutina no tiene días</h2>
            <p>Agrega al menos un día con ejercicios para empezar a registrar.</p>
            <Link className="btn btn-primary" to={`/rutinas/${routine?.id}`}>
              Editar rutina
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
