// Editor de rutina: nombre, días, músculos de cada día y ejercicios.
// Los cambios se guardan solos.

import { useEffect, useRef, useState } from "react";
import { useData } from "../store.jsx";
import { navigate } from "../router.jsx";
import { Icon } from "../icons.jsx";
import { Plate } from "../components/Plate.jsx";
import { Sheet } from "../components/Sheet.jsx";
import { ExercisePicker } from "../components/ExercisePicker.jsx";
import { techniqueUrl } from "../components/ExerciseBrowser.jsx";
import { MUSCLES, MUSCLE_LABEL, EQUIPMENT_LABEL } from "../../backend/data/catalogs.js";
import { uid } from "../../backend/domain/utils.js";
import { plannedVolume, fatigueWarnings } from "../../backend/domain/volume.js";
import { VolumeBars } from "../components/VolumeBars.jsx";
import { FatigueNotice } from "../components/FatigueNotice.jsx";
import { Link } from "../router.jsx";
import { fmtNum } from "../format.js";
import { RepTag } from "../components/RepTag.jsx";
import { GOALS, GOAL_LIST, DEFAULT_GOAL, classifyReps, repsAlertApplies } from "../../backend/data/trainingGoals.js";

const CYCLE_OPTIONS = [0.5, 1, 1.5, 2, 3];

export function RoutineEditor({ id }) {
  const { routines, activeRoutineId, exById, api, run, toast, confirm, reload } = useData();
  const original = routines.find((r) => r.id === id);
  const [r, setR] = useState(() => (original ? structuredClone(original) : null));
  const [picker, setPicker] = useState(null); // { dayIndex, swapIndex? }
  const [editItem, setEditItem] = useState(null); // { dayIndex, itemIndex }
  const [status, setStatus] = useState("saved");
  const timer = useRef(null);

  // Guarda con un pequeño retraso para no escribir en cada tecla
  const commit = (next) => {
    setR(next);
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!next.name.trim()) {
        setStatus("error");
        return;
      }
      try {
        await api.routines.save(next);
        setStatus("saved");
      } catch (e) {
        setStatus("error");
        toast(e.message, "error");
      }
    }, 400);
  };

  // Al salir: guarda pendiente y refresca
  const latest = useRef(r);
  latest.current = r;
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      const cur = latest.current;
      if (cur && cur.name.trim()) api.routines.save(cur).catch(() => {}).finally(reload);
      else reload();
    },
    [api, reload],
  );

  if (!r) {
    return (
      <div className="empty">
        <h2>No encontramos esta rutina</h2>
        <button className="btn btn-primary" onClick={() => navigate("/rutinas")}>
          Ir a Rutinas
        </button>
      </div>
    );
  }

  const change = (fn) => commit(fn(structuredClone(r)));
  const isActive = activeRoutineId === r.id;
  const plan = plannedVolume(r, exById);
  const planWarnings = fatigueWarnings(plan.sets);

  const removeDay = async (di) => {
    const d = r.days[di];
    const ok = await confirm({
      title: `¿Quitar el día “${d.name}”?`,
      message: `Se quitan sus ${d.exercises.length} ejercicios de la rutina. Tu historial no cambia.`,
      confirmLabel: "Quitar día",
      danger: true,
    });
    if (ok) change((x) => { x.days.splice(di, 1); return x; });
  };

  const move = (arr, from, to) => {
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
  };

  return (
    <div className="editor">
      <div className="editor-top">
        <div className="field grow">
          <label htmlFor="rt-name">Nombre de la rutina</label>
          <input
            id="rt-name"
            className="input input-lg"
            value={r.name}
            onChange={(e) => change((x) => ({ ...x, name: e.target.value }))}
            aria-invalid={!r.name.trim()}
          />
          {!r.name.trim() && <span className="error-text">Escribe un nombre para guardar los cambios.</span>}
        </div>
        <p className={`save-status ${status}`} aria-live="polite">
          {status === "saving" ? "Guardando…" : status === "error" ? "Sin guardar" : "Cambios guardados"}
        </p>
      </div>

      {r.description && <p className="hint editor-desc">{r.description}</p>}

      {!isActive && (
        <div className="notice">
          <Icon name="alert" />
          <div className="grow">No es tu rutina activa.</div>
          <button className="btn btn-sm btn-primary" onClick={() => run(() => api.routines.setActive(r.id), `Ahora entrenas con “${r.name}”`)}>
            Usar esta rutina
          </button>
        </div>
      )}

      {planWarnings.some((w) => w.zone === "over") && (
        <a href="#volumen-planificado" className="notice-link" onClick={(e) => { e.preventDefault(); document.getElementById("volumen-planificado")?.scrollIntoView({ behavior: "smooth" }); }}>
          <FatigueNotice warnings={planWarnings} planned />
        </a>
      )}

      {r.days.map((d, di) => (
        <section key={d.id} className="day-editor" aria-label={d.name}>
          <div className="day-editor-head">
            <Plate index={di} size={36} />
            <input
              className="input day-name-input"
              value={d.name}
              aria-label={`Nombre del día ${di + 1}`}
              onChange={(e) => change((x) => { x.days[di].name = e.target.value; return x; })}
            />
            <button className="icon-btn sm" disabled={di === 0} onClick={() => change((x) => { move(x.days, di, di - 1); return x; })} aria-label="Mover día arriba">
              <Icon name="up" />
            </button>
            <button className="icon-btn sm" disabled={di === r.days.length - 1} onClick={() => change((x) => { move(x.days, di, di + 1); return x; })} aria-label="Mover día abajo">
              <Icon name="down" />
            </button>
            <button className="icon-btn sm" onClick={() => removeDay(di)} aria-label={`Quitar día ${d.name}`}>
              <Icon name="trash" />
            </button>
          </div>

          <GoalPicker
            day={d}
            exById={exById}
            onGoal={(g) => change((x) => { x.days[di].goal = g; return x; })}
            onApply={(g) =>
              change((x) => {
                x.days[di].exercises.forEach((it) => {
                  const m = exById.get(it.exerciseId)?.muscle;
                  if (repsAlertApplies(m) && classifyReps(it.reps) !== g) it.reps = GOALS[g].defaultReps;
                });
                return x;
              })
            }
          />

          <div className="focus-picker">
            <span className="label" id={`focus-${d.id}`}>
              Músculos de este día
            </span>
            <span className="hint">Se usan para sugerirte ejercicios al agregar.</span>
            <div className="chips wrap" role="group" aria-labelledby={`focus-${d.id}`}>
              {MUSCLES.map((m) => (
                <button
                  key={m.id}
                  className="chip"
                  aria-pressed={d.focus.includes(m.id)}
                  onClick={() =>
                    change((x) => {
                      const f = x.days[di].focus;
                      x.days[di].focus = f.includes(m.id) ? f.filter((y) => y !== m.id) : [...f, m.id];
                      return x;
                    })
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {d.exercises.length === 0 ? (
            <p className="hint day-empty">Sin ejercicios todavía.</p>
          ) : (
            <ol className="item-list">
              {d.exercises.map((it, ii) => {
                const ex = exById.get(it.exerciseId);
                return (
                  <li key={it.id} className="item">
                    <div className="item-main">
                      <button className="item-name" onClick={() => setEditItem({ dayIndex: di, itemIndex: ii })}>
                        {it.alias || ex?.name || "Ejercicio eliminado"}
                      </button>
                      <span className="row-sub">
                        {MUSCLE_LABEL[ex?.muscle] || ""}
                        {ex ? `, ${EQUIPMENT_LABEL[ex.equipment].toLowerCase()}` : ""}
                        {it.note ? `. ${it.note}` : ""}
                      </span>
                      <RepTag reps={it.reps} muscle={ex?.muscle} />
                    </div>
                    <div className="item-dose">
                      <label className="dose">
                        <span className="visually-hidden">Series</span>
                        <input
                          className="input num"
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="20"
                          value={it.sets}
                          onChange={(e) => change((x) => { x.days[di].exercises[ii].sets = e.target.value; return x; })}
                          aria-label={`Series de ${it.alias || ex?.name}`}
                        />
                      </label>
                      <span aria-hidden="true">×</span>
                      <label className="dose dose-reps">
                        <span className="visually-hidden">Repeticiones</span>
                        <input
                          className="input num"
                          value={it.reps}
                          onChange={(e) => change((x) => { x.days[di].exercises[ii].reps = e.target.value; return x; })}
                          aria-label={`Repeticiones de ${it.alias || ex?.name}`}
                        />
                      </label>
                    </div>
                    <div className="item-actions">
                      <button className="icon-btn sm" disabled={ii === 0} onClick={() => change((x) => { move(x.days[di].exercises, ii, ii - 1); return x; })} aria-label="Mover arriba">
                        <Icon name="up" />
                      </button>
                      <button className="icon-btn sm" disabled={ii === d.exercises.length - 1} onClick={() => change((x) => { move(x.days[di].exercises, ii, ii + 1); return x; })} aria-label="Mover abajo">
                        <Icon name="down" />
                      </button>
                      <button className="icon-btn sm" onClick={() => change((x) => { x.days[di].exercises.splice(ii, 1); return x; })} aria-label={`Quitar ${it.alias || ex?.name}`}>
                        <Icon name="x" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <button className="btn btn-block" onClick={() => setPicker({ dayIndex: di })}>
            <Icon name="plus" /> Agregar ejercicio a {d.name || "este día"}
          </button>
        </section>
      ))}

      <button
        className="btn btn-block btn-dashed"
        onClick={() => change((x) => { x.days.push({ id: uid("day"), name: `Día ${x.days.length + 1}`, goal: DEFAULT_GOAL, focus: [], exercises: [] }); return x; })}
      >
        <Icon name="plus" /> Agregar día
      </button>

      <section className="panel" id="volumen-planificado">
        <div className="section-head stack">
          <h2>Volumen semanal planificado</h2>
          <p>
            Series por semana que suma esta rutina para cada músculo, comparadas con las referencias de volumen efectivo.{" "}
            <Link to="/volumen">Ver la guía de entrenamiento</Link>
          </p>
        </div>
        <div className="field cycles-field">
          <label htmlFor="rt-cycles">¿Cuántas veces por semana haces todos los días de la rutina?</label>
          <select
            id="rt-cycles"
            className="select"
            value={plan.cycles}
            onChange={(e) => change((x) => ({ ...x, cyclesPerWeek: Number(e.target.value) }))}
          >
            {CYCLE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c === 1 ? "1 vez" : `${fmtNum(c, 1).replace(".", ",")} veces`} ({fmtNum(c * r.days.length, 1).replace(".", ",")} entrenamientos por semana)
              </option>
            ))}
          </select>
          <span className="hint">Por ejemplo, Push / Pull / Legs en 6 días son 2 veces por semana.</span>
        </div>
        {planWarnings.length > 0 && <FatigueNotice warnings={planWarnings} planned />}
        <VolumeBars sets={plan.sets} freq={plan.freq} mode="plan" onlyUsed />
        {Object.keys(plan.sets).length === 0 && <p className="hint">Agrega ejercicios para ver el volumen de la rutina.</p>}
      </section>

      <div className="btn-row editor-bottom">
        <button className="btn btn-primary" onClick={() => navigate("/entrenar")}>
          Listo, ir a entrenar
        </button>
      </div>

      {picker && (
        <ExercisePicker
          title={picker.swapIndex !== undefined ? "Cambiar ejercicio" : `Agregar a ${r.days[picker.dayIndex]?.name}`}
          pickLabel={picker.swapIndex !== undefined ? "Elegir" : "Agregar"}
          initialMuscles={
            picker.swapIndex !== undefined
              ? [exById.get(r.days[picker.dayIndex].exercises[picker.swapIndex]?.exerciseId)?.muscle].filter(Boolean)
              : r.days[picker.dayIndex]?.focus || []
          }
          onClose={() => setPicker(null)}
          onPick={(ex) => {
            change((x) => {
              const list = x.days[picker.dayIndex].exercises;
              if (picker.swapIndex !== undefined) {
                list[picker.swapIndex] = { ...list[picker.swapIndex], exerciseId: ex.id, alias: null };
              } else {
                list.push({ id: uid("it"), exerciseId: ex.id, sets: 3, reps: "8-12" });
              }
              return x;
            });
            toast(picker.swapIndex !== undefined ? `Cambiado por ${ex.name}` : `${ex.name} agregado`);
            if (picker.swapIndex !== undefined) setPicker(null);
          }}
        />
      )}

      {editItem && r.days[editItem.dayIndex]?.exercises[editItem.itemIndex] && (
        <ItemSheet
          item={r.days[editItem.dayIndex].exercises[editItem.itemIndex]}
          ex={exById.get(r.days[editItem.dayIndex].exercises[editItem.itemIndex].exerciseId)}
          onClose={() => setEditItem(null)}
          onSwap={() => {
            setPicker({ dayIndex: editItem.dayIndex, swapIndex: editItem.itemIndex });
            setEditItem(null);
          }}
          onSave={(patch) => {
            change((x) => {
              Object.assign(x.days[editItem.dayIndex].exercises[editItem.itemIndex], patch);
              return x;
            });
            setEditItem(null);
          }}
        />
      )}
    </div>
  );
}

function GoalPicker({ day, exById, onGoal, onApply }) {
  const goal = GOALS[day.goal] || GOALS[DEFAULT_GOAL];
  const mismatched = day.exercises.filter((it) => {
    const m = exById.get(it.exerciseId)?.muscle;
    return repsAlertApplies(m) && classifyReps(it.reps) !== goal.id;
  }).length;
  return (
    <div className="goal-picker">
      <span className="label" id={`goal-${day.id}`}>
        Objetivo del día
      </span>
      <div className="segmented" role="group" aria-labelledby={`goal-${day.id}`}>
        {GOAL_LIST.map((g) => (
          <button key={g.id} aria-pressed={goal.id === g.id} onClick={() => onGoal(g.id)}>
            {g.label}
          </button>
        ))}
      </div>
      <span className="hint">
        Carga {goal.load.charAt(0).toLowerCase() + goal.load.slice(1)}, {goal.repsText} repeticiones. {goal.tip}
      </span>
      {mismatched > 0 && (
        <button className="btn btn-sm goal-apply" onClick={() => onApply(goal.id)}>
          Ajustar {mismatched === 1 ? "1 ejercicio" : `${mismatched} ejercicios`} a {goal.defaultReps} repeticiones
        </button>
      )}
    </div>
  );
}

function ItemSheet({ item, ex, onClose, onSave, onSwap }) {
  const [alias, setAlias] = useState(item.alias || "");
  const [note, setNote] = useState(item.note || "");
  return (
    <Sheet
      title={item.alias || ex?.name || "Ejercicio"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={() => onSave({ alias: alias.trim() || null, note: note.trim() })}>
            Guardar
          </button>
        </>
      }
    >
      {ex && (
        <p className="hint">
          Ejercicio del catálogo: <strong>{ex.name}</strong> ({MUSCLE_LABEL[ex.muscle]}).{" "}
          <a href={techniqueUrl(ex)} target="_blank" rel="noreferrer">
            {ex.video ? "Ver técnica" : "Buscar técnica"}
          </a>
        </p>
      )}
      <div className="field">
        <label htmlFor="it-alias">Nombre a mostrar (opcional)</label>
        <input id="it-alias" className="input" placeholder={ex?.name} value={alias} onChange={(e) => setAlias(e.target.value)} />
        <span className="hint">Útil para distinguir variantes, por ejemplo “Lateral polea (derecha)”. Tu progreso se agrupa por este nombre.</span>
      </div>
      <div className="field">
        <label htmlFor="it-note">Indicación (opcional)</label>
        <input id="it-note" className="input" placeholder="Ej.: superserie con el siguiente" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button className="btn" onClick={onSwap}>
        <Icon name="swap" /> Cambiar por otro ejercicio
      </button>
    </Sheet>
  );
}
