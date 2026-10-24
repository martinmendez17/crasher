// Historial de entrenamientos guardados.

import { useMemo, useState } from "react";
import { useData } from "../store.jsx";
import { Link } from "../router.jsx";
import { Icon } from "../icons.jsx";
import { nameKey } from "../../backend/domain/utils.js";
import { e1rm } from "../../backend/domain/progression.js";
import { fmtDate, fmtDateLong, fmtNum, fmtTonnage, plural } from "../format.js";

export function HistoryPage() {
  const { sessions, api, run, confirm } = useData();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);

  const sorted = useMemo(() => {
    const k = nameKey(q);
    return [...sessions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
      .filter((s) => !k || nameKey([s.dayName, s.routineName, s.notes, ...s.exercises.map((e) => e.name)].join(" ")).includes(k));
  }, [sessions, q]);

  const byMonth = useMemo(() => {
    const groups = [];
    for (const s of sorted) {
      const raw = fmtDate(s.date, { month: "long", year: "numeric" });
      const label = raw.charAt(0).toUpperCase() + raw.slice(1);
      if (!groups.length || groups[groups.length - 1].label !== label) groups.push({ label, items: [] });
      groups[groups.length - 1].items.push(s);
    }
    return groups;
  }, [sorted]);

  if (!sessions.length) {
    return (
      <div className="empty">
        <h2>Todavía no hay entrenamientos</h2>
        <p>Cada entrenamiento que guardes aparecerá aquí, con todas sus series.</p>
        <Link className="btn btn-primary" to="/entrenar">
          Ir a entrenar
        </Link>
      </div>
    );
  }

  const remove = async (s) => {
    const ok = await confirm({
      title: "¿Eliminar este entrenamiento?",
      message: `${s.dayName}, ${fmtDateLong(s.date)}. Se borra del historial y del progreso.`,
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (ok) run(() => api.sessions.remove(s.id), "Entrenamiento eliminado");
  };

  return (
    <>
      <div className="search history-search">
        <Icon name="search" />
        <input className="input" type="search" placeholder="Buscar por día o ejercicio" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en el historial" />
      </div>

      {byMonth.length === 0 && <p className="hint center">No hay entrenamientos que coincidan con “{q}”.</p>}

      {byMonth.map((g) => (
        <section key={g.label} className="section">
          <h2 className="month">{g.label}</h2>
          <div className="history">
            {g.items.map((s) => {
              const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
              const ton = s.exercises.reduce((n, e) => n + e.sets.reduce((m, st) => m + st.weight * st.reps, 0), 0);
              const isOpen = open === s.id;
              return (
                <article key={s.id} className="session">
                  <button className="session-head" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                    <span className="session-date">
                      <span className="num">{fmtDate(s.date, { day: "numeric" })}</span>
                      <span>{fmtDate(s.date, { weekday: "short" })}</span>
                    </span>
                    <span className="grow">
                      <span className="row-title block">{s.dayName}</span>
                      <span className="row-sub block">
                        {plural(s.exercises.length, "ejercicio", "ejercicios")}, {plural(sets, "serie", "series")}, {fmtTonnage(ton)}
                        {s.durationMin ? `, ${s.durationMin} min` : ""}
                      </span>
                    </span>
                    <Icon name={isOpen ? "up" : "down"} width={20} />
                  </button>
                  {isOpen && (
                    <div className="session-body">
                      {s.routineName && <p className="hint">Rutina: {s.routineName}</p>}
                      {s.notes && <p className="session-notes-text">“{s.notes}”</p>}
                      {s.exercises.map((e, i) => (
                        <div key={i} className="session-ex">
                          <h3>{e.name}</h3>
                          {e.note && <p className="hint">{e.note}</p>}
                          <div className="table-wrap">
                            <table className="data">
                              <thead>
                                <tr>
                                  <th>Serie</th>
                                  <th className="n">kg</th>
                                  <th className="n">Reps</th>
                                  <th className="n">RIR</th>
                                  <th className="n">1RM est.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {e.sets.map((st, j) => (
                                  <tr key={j}>
                                    <td>{j + 1}</td>
                                    <td className="n">{fmtNum(st.weight, 2)}</td>
                                    <td className="n">{st.reps}</td>
                                    <td className="n">{st.rir ?? "–"}</td>
                                    <td className="n">{fmtNum(e1rm(st.weight, st.reps))}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                      <button className="btn btn-sm btn-danger" onClick={() => remove(s)}>
                        <Icon name="trash" /> Eliminar entrenamiento
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
