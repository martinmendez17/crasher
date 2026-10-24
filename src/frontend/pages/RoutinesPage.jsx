// Rutinas: las tuyas (editables) y los modelos de entrenamiento base.

import { useData } from "../store.jsx";
import { Link, navigate } from "../router.jsx";
import { Icon } from "../icons.jsx";
import { Plate } from "../components/Plate.jsx";
import { TemplateGallery } from "../components/TemplateGallery.jsx";
import { plural } from "../format.js";

export function RoutinesPage() {
  const { routines, activeRoutineId, api, run, confirm } = useData();

  const remove = async (r) => {
    const ok = await confirm({
      title: `¿Eliminar “${r.name}”?`,
      message: "La rutina se borra, pero los entrenamientos que ya registraste se mantienen en tu historial.",
      confirmLabel: "Eliminar rutina",
      danger: true,
    });
    if (ok) run(() => api.routines.remove(r.id), "Rutina eliminada");
  };

  return (
    <>
      <section className="section">
        <div className="section-head">
          <h2>Mis rutinas</h2>
          <button
            className="btn btn-sm"
            onClick={async () => {
              const r = await run(() => api.routines.createBlank("Rutina nueva"));
              if (r) navigate(`/rutinas/${r.id}`);
            }}
          >
            <Icon name="plus" /> Rutina vacía
          </button>
        </div>

        {routines.length === 0 ? (
          <div className="empty panel">
            <h2>Aún no tienes rutinas</h2>
            <p>Elige uno de los modelos de abajo o crea una rutina vacía y arma tus días desde cero.</p>
          </div>
        ) : (
          <div className="list">
            {routines.map((r) => {
              const active = r.id === activeRoutineId;
              return (
                <div key={r.id} className="list-row routine-row">
                  <div className="routine-plates" aria-hidden="true">
                    {r.days.slice(0, 6).map((_, i) => (
                      <Plate key={i} index={i} size={16} />
                    ))}
                  </div>
                  <div className="grow">
                    <Link className="row-title row-link" to={`/rutinas/${r.id}`}>
                      {r.name}
                    </Link>
                    <div className="row-sub">
                      {plural(r.days.length, "día", "días")}: {r.days.map((d) => d.name).join(", ")}
                    </div>
                  </div>
                  <div className="routine-actions">
                  {active ? (
                    <span className="badge success">
                      <Icon name="check" /> En uso
                    </span>
                  ) : (
                    <button className="btn btn-sm" onClick={() => run(() => api.routines.setActive(r.id), `Ahora entrenas con “${r.name}”`)}>
                      Usar
                    </button>
                  )}
                  <Link className="icon-btn sm" to={`/rutinas/${r.id}`} aria-label={`Editar ${r.name}`} title="Editar">
                    <Icon name="edit" />
                  </Link>
                  <button className="icon-btn sm" onClick={() => run(() => api.routines.duplicate(r.id), "Rutina duplicada")} aria-label={`Duplicar ${r.name}`} title="Duplicar">
                    <Icon name="copy" />
                  </button>
                  <button className="icon-btn sm" onClick={() => remove(r)} aria-label={`Eliminar ${r.name}`} title="Eliminar">
                    <Icon name="trash" />
                  </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head stack">
          <h2>Modelos de entrenamiento</h2>
          <p>Al usar un modelo se crea una copia en “Mis rutinas”. Puedes cambiarle ejercicios, series y días sin afectar el original.</p>
        </div>
        <TemplateGallery />
      </section>
    </>
  );
}
