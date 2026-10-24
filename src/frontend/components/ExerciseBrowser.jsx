// Buscador del catálogo de ejercicios con filtros por músculo, equipo y "en casa".
// Se usa en la pantalla Ejercicios y dentro del selector al armar rutinas.

import { useMemo, useState } from "react";
import { Icon } from "../icons.jsx";
import { MUSCLES, EQUIPMENT, MUSCLE_LABEL, EQUIPMENT_LABEL } from "../../backend/data/catalogs.js";
import { nameKey } from "../../backend/domain/utils.js";
import { useData } from "../store.jsx";

export function techniqueUrl(ex) {
  return ex.video || `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " técnica")}`;
}

const SOURCE_LABEL = { enciclopedia: "Enciclopedia", base: "Básico", custom: "Creado por ti" };

export function ExerciseBrowser({ initialMuscles = [], onPick, renderActions, pickLabel = "Agregar" }) {
  const { exercises, api, run } = useData();
  const [q, setQ] = useState("");
  const [muscles, setMuscles] = useState(initialMuscles);
  const [equipment, setEquipment] = useState("");
  const [homeOnly, setHomeOnly] = useState(false);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const k = nameKey(q);
    return exercises.filter(
      (e) =>
        (!k || nameKey(e.name).includes(k)) &&
        (muscles.length === 0 || muscles.includes(e.muscle)) &&
        (!equipment || e.equipment === equipment) &&
        (!homeOnly || e.home),
    );
  }, [exercises, q, muscles, equipment, homeOnly]);

  const groups = useMemo(() => {
    return MUSCLES.map((m) => ({
      ...m,
      items: filtered.filter((e) => e.muscle === m.id).sort((a, b) => a.name.localeCompare(b.name, "es")),
    })).filter((g) => g.items.length);
  }, [filtered]);

  const toggleMuscle = (id) => setMuscles((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="browser">
      <div className="browser-filters">
        <div className="search">
          <Icon name="search" />
          <input
            className="input"
            type="search"
            placeholder="Buscar ejercicio"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar ejercicio"
          />
        </div>
        <div className="chips" role="group" aria-label="Filtrar por músculo">
          <button className="chip" aria-pressed={muscles.length === 0} onClick={() => setMuscles([])}>
            Todos
          </button>
          {MUSCLES.map((m) => (
            <button key={m.id} className="chip" aria-pressed={muscles.includes(m.id)} onClick={() => toggleMuscle(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="browser-row">
          <select className="select" value={equipment} onChange={(e) => setEquipment(e.target.value)} aria-label="Filtrar por equipo">
            <option value="">Cualquier equipo</option>
            {EQUIPMENT.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
          <button className="chip" aria-pressed={homeOnly} onClick={() => setHomeOnly((v) => !v)}>
            <Icon name="home" /> Para casa
          </button>
        </div>
        <p className="hint" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "ejercicio" : "ejercicios"}
        </p>
      </div>

      {groups.map((g) => (
        <div key={g.id} className="browser-group">
          <h3 className="browser-group-title">{g.label}</h3>
          <div className="list">
            {g.items.map((ex) => (
              <div key={ex.id} className="list-row">
                <div className="grow">
                  <div className="row-title">{ex.name}</div>
                  <div className="row-sub">
                    {EQUIPMENT_LABEL[ex.equipment]}
                    {ex.source === "custom" ? " · Creado por ti" : ""}
                  </div>
                </div>
                <a
                  className="icon-btn sm"
                  href={techniqueUrl(ex)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${ex.video ? "Ver video de técnica" : "Buscar técnica en YouTube"}: ${ex.name}`}
                  title={ex.video ? "Ver video de técnica" : "Buscar técnica en YouTube"}
                >
                  <Icon name={ex.video ? "play" : "search"} />
                </a>
                {renderActions?.(ex)}
                {onPick && (
                  <button className="btn btn-sm" onClick={() => onPick(ex)}>
                    <Icon name="plus" /> {pickLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="empty">
          <h2>Sin resultados</h2>
          <p>Prueba con otra palabra o quita filtros. Si el ejercicio no existe, puedes crearlo.</p>
        </div>
      )}

      {creating ? (
        <NewExerciseForm
          initialName={q}
          initialMuscle={muscles[0] || ""}
          onCancel={() => setCreating(false)}
          onCreate={async (input) => {
            const ex = await run(() => api.exercises.create(input), (x) => `Creaste “${x.name}”`);
            if (ex) {
              setCreating(false);
              setQ("");
              onPick?.(ex);
            }
          }}
        />
      ) : (
        <button className="btn btn-block" onClick={() => setCreating(true)}>
          <Icon name="plus" /> Crear ejercicio nuevo
        </button>
      )}
    </div>
  );
}

export function NewExerciseForm({ initialName = "", initialMuscle = "", onCreate, onCancel }) {
  const [name, setName] = useState(initialName);
  const [muscle, setMuscle] = useState(initialMuscle);
  const [equipment, setEquipment] = useState("mancuernas");
  const [video, setVideo] = useState("");

  return (
    <form
      className="panel form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({ name, muscle, equipment, video });
      }}
    >
      <h3>Ejercicio nuevo</h3>
      <div className="field">
        <label htmlFor="nx-name">Nombre</label>
        <input id="nx-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required data-autofocus />
      </div>
      <div className="form-2col">
        <div className="field">
          <label htmlFor="nx-muscle">Músculo principal</label>
          <select id="nx-muscle" className="select" value={muscle} onChange={(e) => setMuscle(e.target.value)} required>
            <option value="" disabled>
              Elige uno
            </option>
            {MUSCLES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="nx-eq">Equipo</label>
          <select id="nx-eq" className="select" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            {EQUIPMENT.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="nx-video">Link de video (opcional)</label>
        <input id="nx-video" className="input" type="url" placeholder="https://youtube.com/…" value={video} onChange={(e) => setVideo(e.target.value)} />
      </div>
      <div className="btn-row">
        <button type="submit" className="btn btn-primary">
          Crear ejercicio
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export { MUSCLE_LABEL, SOURCE_LABEL };
