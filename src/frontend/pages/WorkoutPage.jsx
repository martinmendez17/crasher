// Registro de un entrenamiento: series, metas sugeridas y descanso.

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useData } from "../store.jsx";
import { navigate } from "../router.jsx";
import { Icon } from "../icons.jsx";
import { Plate } from "../components/Plate.jsx";
import { Sheet } from "../components/Sheet.jsx";
import { ExercisePicker } from "../components/ExercisePicker.jsx";
import { techniqueUrl } from "../components/ExerciseBrowser.jsx";
import { MUSCLE_LABEL } from "../../backend/data/catalogs.js";
import { LANDMARKS } from "../../backend/data/volumeLandmarks.js";
import { GOALS, DEFAULT_GOAL, REPS_ALERT, REPS_ALERT_MESSAGE, REPS_ALERT_HELP, repsAlertApplies } from "../../backend/data/trainingGoals.js";
import { lastPerformance, suggestTarget, compareSet } from "../../backend/domain/progression.js";
import { todayISO, uid } from "../../backend/domain/utils.js";
import { relDay, fmtNum, plural } from "../format.js";

const emptySet = () => ({ weight: "", reps: "", rir: "", rpe: "", done: false });

function buildDraft(routine, day, exById) {
  return {
    routineId: routine.id,
    dayId: day.id,
    date: todayISO(),
    startedAt: Date.now(),
    notes: "",
    exercises: day.exercises.map((it) => {
      const ex = exById.get(it.exerciseId);
      return {
        key: uid("wx"),
        exerciseId: it.exerciseId,
        name: it.alias || ex?.name || "Ejercicio",
        muscle: ex?.muscle || "core",
        reps: it.reps,
        planNote: it.note || "",
        note: "",
        sets: Array.from({ length: it.sets || 3 }, emptySet),
      };
    }),
  };
}

export function WorkoutPage({ routineId, dayId }) {
  const { routines, exById, sessions, settings, draft, api, run, toast, confirm, reload } = useData();
  const routine = routines.find((r) => r.id === routineId);
  const day = routine?.days.find((d) => d.id === dayId);
  const dayIndex = routine?.days.findIndex((d) => d.id === dayId) ?? 0;

  const sameDraft = draft && draft.routineId === routineId && draft.dayId === dayId;
  const otherDraft = draft && !sameDraft ? draft : null;
  const [w, setW] = useState(() => (sameDraft ? draft : null));
  const [picker, setPicker] = useState(null); // { mode: "add" } | { mode: "swap", index }
  const [menuFor, setMenuFor] = useState(null);
  const [rest, setRest] = useState(null); // { endAt, total }
  const [saving, setSaving] = useState(false);

  // Crea el borrador si no hay otro entrenamiento pendiente
  useEffect(() => {
    if (!w && !otherDraft && routine && day) {
      const d = buildDraft(routine, day, exById);
      setW(d);
      api.draft.save(d);
    }
  }, [w, otherDraft, routine, day, exById, api]);

  // Refresca el estado global al salir (para el aviso de "entrenamiento sin guardar")
  useEffect(() => () => { reload(); }, [reload]);

  const update = useCallback(
    (fn) => {
      setW((cur) => {
        const next = fn(structuredClone(cur));
        api.draft.save(next);
        return next;
      });
    },
    [api],
  );

  if (!routine || !day) {
    return (
      <div className="empty">
        <h2>No encontramos este día</h2>
        <p>Puede que la rutina se haya borrado o editado.</p>
        <button className="btn btn-primary" onClick={() => navigate("/entrenar")}>
          Volver a Entrenar
        </button>
      </div>
    );
  }

  if (otherDraft && !w) {
    const od = routines.find((r) => r.id === otherDraft.routineId)?.days.find((d) => d.id === otherDraft.dayId);
    return (
      <div className="empty panel">
        <h2>Tienes otro entrenamiento sin guardar</h2>
        <p>
          Empezaste {od ? `“${od.name}”` : "otro día"} y no lo guardaste. Puedes seguir con ese o descartarlo para empezar
          “{day.name}”.
        </p>
        <div className="btn-row center">
          {od && (
            <button className="btn btn-primary" onClick={() => navigate(`/entrenar/${otherDraft.routineId}/${otherDraft.dayId}`, { replace: true })}>
              Seguir con {od.name}
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={async () => {
              await api.draft.clear();
              const d = buildDraft(routine, day, exById);
              await api.draft.save(d);
              setW(d);
              reload();
            }}
          >
            Descartarlo y empezar {day.name}
          </button>
        </div>
      </div>
    );
  }

  if (!w) return null;

  const filledSets = w.exercises.reduce((n, e) => n + e.sets.filter((s) => s.weight !== "" || s.reps !== "").length, 0);

  const startRest = () => {
    const secs = Number(settings.restSeconds) || 0;
    if (secs > 0) setRest({ endAt: Date.now() + secs * 1000, total: secs });
  };

  const save = async () => {
    setSaving(true);
    const minutes = Math.max(1, Math.round((Date.now() - (w.startedAt || Date.now())) / 60000));
    const res = await run(
      () =>
        api.sessions.create({
          date: w.date,
          routineId: routine.id,
          routineName: routine.name,
          dayId: day.id,
          dayName: day.name,
          notes: w.notes,
          durationMin: minutes,
          exercises: w.exercises.map(({ exerciseId, name, muscle, note, sets }) => ({ exerciseId, name, muscle, note, sets })),
        }),
      "Entrenamiento guardado",
    );
    if (res) {
      await api.draft.clear();
      await reload();
      navigate("/entrenar");
    }
    setSaving(false);
  };

  const discard = async () => {
    const ok = await confirm({
      title: "¿Descartar este entrenamiento?",
      message: "Se borrarán las series que anotaste en esta sesión. Tu historial no cambia.",
      confirmLabel: "Descartar",
      danger: true,
    });
    if (!ok) return;
    await api.draft.clear();
    await reload();
    navigate("/entrenar");
  };

  return (
    <div className="workout">
      <header className="workout-head">
        <Plate index={dayIndex} size={48} />
        <div className="grow">
          <h1>{day.name}</h1>
          <p className="row-sub">{routine.name}</p>
        </div>
        <label className="date-field">
          <span className="visually-hidden">Fecha del entrenamiento</span>
          <input
            type="date"
            className="input"
            value={w.date}
            max={todayISO()}
            onChange={(e) => update((d) => ({ ...d, date: e.target.value || todayISO() }))}
          />
        </label>
      </header>

      {(() => {
        const g = GOALS[day.goal] || GOALS[DEFAULT_GOAL];
        return (
          <p className={`goal-line goal-${g.id}`}>
            <span className={`badge goal-${g.id}`}>{g.label}</span>
            Carga {g.load.charAt(0).toLowerCase() + g.load.slice(1)}, {g.repsText} repeticiones.
          </p>
        );
      })()}

      {w.exercises.length === 0 && (
        <div className="empty panel">
          <h2>Este día no tiene ejercicios</h2>
          <p>Agrega ejercicios para esta sesión, o edita la rutina para que queden guardados.</p>
        </div>
      )}

      {w.exercises.map((ex, i) => (
        <ExerciseBlock
          key={ex.key}
          ex={ex}
          index={i}
          sessions={sessions}
          settings={settings}
          exInfo={exById.get(ex.exerciseId)}
          onChange={(fn) => update((d) => { d.exercises[i] = fn(d.exercises[i]); return d; })}
          onMenu={() => setMenuFor(i)}
          onSetDone={startRest}
          toast={toast}
        />
      ))}

      <button className="btn btn-block add-exercise" onClick={() => setPicker({ mode: "add" })}>
        <Icon name="plus" /> Agregar ejercicio a esta sesión
      </button>

      <div className="field session-notes">
        <label htmlFor="session-notes">Notas de la sesión (opcional)</label>
        <textarea
          id="session-notes"
          className="textarea"
          placeholder="Cómo te sentiste, molestias, cambios de máquina…"
          value={w.notes}
          onChange={(e) => update((d) => ({ ...d, notes: e.target.value }))}
        />
      </div>

      <div className="dock">
      {rest && <RestTimer rest={rest} setRest={setRest} />}
      <div className="savebar">
        <button className="btn" onClick={discard}>
          Descartar
        </button>
        <button className="btn btn-primary grow" onClick={save} disabled={saving || filledSets === 0}>
          <Icon name="check" /> Guardar
          {filledSets > 0 && <span className="savebar-count">({plural(filledSets, "serie", "series")})</span>}
        </button>
      </div>
      </div>

      {menuFor !== null && w.exercises[menuFor] && (
        <Sheet title={w.exercises[menuFor].name} onClose={() => setMenuFor(null)}>
          <div className="list">
            <a className="list-row" href={techniqueUrl(exById.get(w.exercises[menuFor].exerciseId) || { name: w.exercises[menuFor].name })} target="_blank" rel="noreferrer">
              <Icon name="play" width={22} /> <span className="grow">Ver técnica</span>
            </a>
            <button className="list-row" onClick={() => { setPicker({ mode: "swap", index: menuFor }); setMenuFor(null); }}>
              <Icon name="swap" width={22} /> <span className="grow">Cambiar por otro ejercicio (solo hoy)</span>
            </button>
            <button className="list-row" disabled={menuFor === 0} onClick={() => { update((d) => { const [x] = d.exercises.splice(menuFor, 1); d.exercises.splice(menuFor - 1, 0, x); return d; }); setMenuFor(null); }}>
              <Icon name="arrowUp" width={22} /> <span className="grow">Mover arriba</span>
            </button>
            <button className="list-row" disabled={menuFor === w.exercises.length - 1} onClick={() => { update((d) => { const [x] = d.exercises.splice(menuFor, 1); d.exercises.splice(menuFor + 1, 0, x); return d; }); setMenuFor(null); }}>
              <Icon name="arrowDown" width={22} /> <span className="grow">Mover abajo</span>
            </button>
            <button className="list-row danger-row" onClick={() => { update((d) => { d.exercises.splice(menuFor, 1); return d; }); setMenuFor(null); }}>
              <Icon name="trash" width={22} /> <span className="grow">Quitar de esta sesión</span>
            </button>
          </div>
          <p className="hint">Estos cambios son solo para hoy. Para cambiar la rutina de forma permanente, edítala en Rutinas.</p>
        </Sheet>
      )}

      {picker && (
        <ExercisePicker
          title={picker.mode === "swap" ? "Cambiar ejercicio" : "Agregar ejercicio"}
          pickLabel={picker.mode === "swap" ? "Elegir" : "Agregar"}
          initialMuscles={picker.mode === "swap" ? [w.exercises[picker.index]?.muscle].filter(Boolean) : day.focus}
          onClose={() => setPicker(null)}
          onPick={(ex) => {
            update((d) => {
              if (picker.mode === "swap") {
                const old = d.exercises[picker.index];
                d.exercises[picker.index] = { ...old, key: uid("wx"), exerciseId: ex.id, name: ex.name, muscle: ex.muscle, planNote: "" };
              } else {
                d.exercises.push({ key: uid("wx"), exerciseId: ex.id, name: ex.name, muscle: ex.muscle, reps: "8-12", planNote: "", note: "", sets: [emptySet(), emptySet(), emptySet()] });
              }
              return d;
            });
            toast(picker.mode === "swap" ? `Cambiado por ${ex.name}` : `${ex.name} agregado`);
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

function ExerciseBlock({ ex, sessions, settings, exInfo, onChange, onMenu, onSetDone, toast }) {
  const prev = useMemo(() => lastPerformance(sessions, ex.name), [sessions, ex.name]);
  const inc = Number(settings.increment) || 2.5;
  const targets = ex.sets.map((_, i) => {
    const p = prev ? prev.sets[i] || prev.sets[prev.sets.length - 1] : null;
    return { prev: p, target: suggestTarget(p, ex.reps, inc) };
  });
  const first = targets[0]?.target;
  const hints = settings.showHints;

  const setField = (i, field, value) =>
    onChange((e) => {
      e.sets[i][field] = value;
      return e;
    });

  const toggleDone = (i) => {
    const s = ex.sets[i];
    if (s.done) return onChange((e) => { e.sets[i].done = false; return e; });
    const t = targets[i].target;
    const weight = s.weight !== "" ? s.weight : t ? String(t.weight) : "";
    const reps = s.reps !== "" ? s.reps : t ? String(t.reps) : "";
    if (weight === "" && reps === "") {
      toast("Anota el peso y las repeticiones de esta serie.", "error");
      return;
    }
    onChange((e) => {
      Object.assign(e.sets[i], { weight, reps, done: true });
      return e;
    });
    if (repsAlertApplies(ex.muscle) && Number(reps) > REPS_ALERT) toast(`${REPS_ALERT_MESSAGE} ${REPS_ALERT_HELP}`, "error");
    onSetDone();
  };

  const cols = ["set", hints && "prev", "kg", "reps", settings.showRIR && "rir", settings.showRPE && "rpe", "done"].filter(Boolean);

  return (
    <section className="exercise" aria-label={ex.name}>
      <div className="exercise-head">
        <div className="grow">
          <h2 className="exercise-name">{ex.name}</h2>
          <p className="row-sub">
            {MUSCLE_LABEL[ex.muscle] || ""} · {ex.sets.length} × {ex.reps}
            {exInfo?.video && (
              <>
                {" · "}
                <a href={exInfo.video} target="_blank" rel="noreferrer">
                  Ver técnica
                </a>
              </>
            )}
          </p>
          {ex.planNote && <p className="plan-note">{ex.planNote}</p>}
        </div>
        <button className="icon-btn" onClick={onMenu} aria-label={`Opciones de ${ex.name}`}>
          <Icon name="more" />
        </button>
      </div>

      {hints && (
        <p className="target-line">
          {prev ? (
            <>
              <span>
                Última vez ({relDay(prev.date)}):{" "}
                <span className="num">{prev.sets.map((s) => `${fmtNum(s.weight)}×${s.reps}`).join(", ")}</span>
              </span>
              {first && (
                <strong className={first.raised ? "goal raised" : "goal"}>
                  {first.raised ? `Meta: sube a ${fmtNum(first.weight, 2)} kg × ${first.reps}` : `Meta: ${fmtNum(first.weight, 2)} kg × ${first.reps} (una repetición más)`}
                </strong>
              )}
            </>
          ) : (
            <span>Primera vez con este ejercicio: anota tu marca base.</span>
          )}
        </p>
      )}

      <div className={`sets cols-${cols.length}`} role="group" aria-label={`Series de ${ex.name}`}>
        <div className="set-row set-header" aria-hidden="true">
          <span>#</span>
          {hints && <span>Anterior</span>}
          <span>kg</span>
          <span>Reps</span>
          {settings.showRIR && (
            <span title="Repeticiones en reserva">
              RIR
            </span>
          )}
          {settings.showRPE && <span>RPE</span>}
          <span>
            <span className="visually-hidden">Hecha</span>
          </span>
        </div>
        {ex.sets.map((s, i) => {
          const { prev: p, target: t } = targets[i];
          const cmp = s.done ? compareSet(s, p) : null;
          const tooMany = repsAlertApplies(ex.muscle) && Number(s.reps) > REPS_ALERT;
          return (
            <Fragment key={i}>
            <div className={`set-row ${s.done ? "is-done" : ""} ${tooMany ? "too-many" : ""}`}>
              <span className="set-n num">
                {i + 1}
              </span>
              {hints && (
                <span className="set-prev num">
                  {p ? `${fmtNum(p.weight)}×${p.reps}` : "—"}
                  {cmp === "up" && <Icon name="arrowUp" className="cmp up" title="Superaste la vez anterior" />}
                  {cmp === "same" && <span className="cmp same" title="Igualaste la vez anterior">=</span>}
                  {cmp === "down" && <Icon name="arrowDown" className="cmp down" title="Por debajo de la vez anterior" />}
                </span>
              )}
              <input
                className="set-input num"
                type="number"
                inputMode="decimal"
                step="0.25"
                min="0"
                aria-label={`Peso serie ${i + 1} en kg`}
                placeholder={hints && t ? fmtNum(t.weight, 2) : "kg"}
                value={s.weight}
                onChange={(e) => setField(i, "weight", e.target.value)}
              />
              <input
                className="set-input num"
                type="number"
                inputMode="numeric"
                min="0"
                aria-label={`Repeticiones serie ${i + 1}`}
                placeholder={hints && t ? String(t.reps) : "reps"}
                value={s.reps}
                onChange={(e) => setField(i, "reps", e.target.value)}
              />
              {settings.showRIR && (
                <input
                    className="set-input num small"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="10"
                  step="0.5"
                  aria-label={`RIR serie ${i + 1}${LANDMARKS[ex.muscle] ? `, recomendado ${LANDMARKS[ex.muscle].rir}` : ""}`}
                  placeholder={LANDMARKS[ex.muscle]?.rir || "–"}
                  value={s.rir}
                  onChange={(e) => setField(i, "rir", e.target.value)}
                />
              )}
              {settings.showRPE && (
                <input
                    className="set-input num small"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="10"
                  step="0.5"
                  aria-label={`RPE serie ${i + 1}`}
                  placeholder="–"
                  value={s.rpe}
                  onChange={(e) => setField(i, "rpe", e.target.value)}
                />
              )}
              <button
                className="set-done"
                aria-pressed={s.done}
                aria-label={s.done ? `Serie ${i + 1} hecha. Tocar para desmarcar` : `Marcar serie ${i + 1} como hecha`}
                onClick={() => toggleDone(i)}
              >
                <Icon name="check" />
              </button>
            </div>
            {tooMany && (
              <p className="reps-alert" role="alert">
                <Icon name="alert" />
                <span>
                  <strong>{REPS_ALERT_MESSAGE}</strong> {REPS_ALERT_HELP}
                </span>
              </p>
            )}
            </Fragment>
          );
        })}
      </div>

      <div className="exercise-foot">
        <button className="btn btn-sm" onClick={() => onChange((e) => { e.sets.push(emptySet()); return e; })}>
          <Icon name="plus" /> Serie
        </button>
        <button
          className="btn btn-sm"
          disabled={ex.sets.length <= 1}
          onClick={() => onChange((e) => { e.sets.pop(); return e; })}
        >
          <Icon name="minus" /> Serie
        </button>
        {settings.showNotes && (
          <input
            className="input exercise-note"
            placeholder="Nota (opcional)"
            aria-label={`Nota para ${ex.name}`}
            value={ex.note}
            onChange={(e) => onChange((x) => ({ ...x, note: e.target.value }))}
          />
        )}
      </div>
    </section>
  );
}

function RestTimer({ rest, setRest }) {
  const [now, setNow] = useState(Date.now());
  const buzzed = useRef(false);

  useEffect(() => {
    buzzed.current = false;
  }, [rest.endAt]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, Math.ceil((rest.endAt - now) / 1000));
  useEffect(() => {
    if (left === 0 && !buzzed.current) {
      buzzed.current = true;
      try { navigator.vibrate?.([200, 100, 200]); } catch {}
      const t = setTimeout(() => setRest(null), 4000);
      return () => clearTimeout(t);
    }
  }, [left, setRest]);

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const pct = Math.min(100, ((rest.total - left) / rest.total) * 100);

  return (
    <div className={`rest ${left === 0 ? "is-over" : ""}`} role="timer" aria-live={left === 0 ? "assertive" : "off"}>
      <div className="rest-bar" style={{ width: `${pct}%` }} />
      <Icon name="timer" />
      <span className="rest-text">
        {left === 0 ? (
          "Descanso terminado"
        ) : (
          <>
            Descanso <span className="num rest-time">{mm}:{ss}</span>
          </>
        )}
      </span>
      {left > 0 && (
        <>
          <button className="btn btn-sm" onClick={() => setRest((r) => ({ ...r, endAt: r.endAt - 15000 }))} aria-label="Restar 15 segundos">
            −15 s
          </button>
          <button className="btn btn-sm" onClick={() => setRest((r) => ({ ...r, endAt: r.endAt + 15000, total: r.total + 15 }))} aria-label="Sumar 15 segundos">
            +15 s
          </button>
        </>
      )}
      <button className="icon-btn sm" onClick={() => setRest(null)} aria-label="Cerrar descanso">
        <Icon name="x" />
      </button>
    </div>
  );
}
