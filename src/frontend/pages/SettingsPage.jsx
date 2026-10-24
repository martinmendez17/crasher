// Ajustes: apariencia, registro, descanso y datos.

import { useRef } from "react";
import { useData } from "../store.jsx";
import { Icon } from "../icons.jsx";
import { todayISO } from "../../backend/domain/utils.js";

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SettingsPage() {
  const { settings, api, run, toast, confirm, sessions } = useData();
  const fileRef = useRef(null);
  const set = (patch) => run(() => api.settings.save(patch));

  const toggles = [
    ["showHints", "Mostrar metas sugeridas", "Muestra lo que hiciste la vez anterior y cuánto deberías hacer hoy."],
    ["showRIR", "Registrar RIR", "Repeticiones que te quedaron en reserva al terminar la serie."],
    ["showRPE", "Registrar RPE", "Esfuerzo percibido de 1 a 10."],
    ["showNotes", "Notas por ejercicio", "Un campo de texto bajo cada ejercicio."],
  ];

  return (
    <>
      <section className="section panel">
        <h2>Apariencia</h2>
        <div className="segmented settings-seg" role="group" aria-label="Tema">
          {[
            ["system", "Igual que el sistema"],
            ["light", "Claro"],
            ["dark", "Oscuro"],
          ].map(([v, l]) => (
            <button key={v} aria-pressed={settings.theme === v} onClick={() => set({ theme: v })}>
              {l}
            </button>
          ))}
        </div>
      </section>

      <section className="section panel">
        <h2>Registro de series</h2>
        {toggles.map(([k, label, help]) => (
          <label key={k} className="switch-row">
            <span className="switch-text">
              <span className="row-title">{label}</span>
              <span className="row-sub">{help}</span>
            </span>
            <input type="checkbox" className="switch" checked={!!settings[k]} onChange={(e) => set({ [k]: e.target.checked })} />
          </label>
        ))}
      </section>

      <section className="section panel">
        <h2>Descanso y progresión</h2>
        <div className="form-2col">
          <div className="field">
            <label htmlFor="rest">Descanso entre series</label>
            <select id="rest" className="select" value={settings.restSeconds} onChange={(e) => set({ restSeconds: Number(e.target.value) })}>
              <option value={0}>Sin temporizador</option>
              {[45, 60, 90, 120, 150, 180, 240].map((s) => (
                <option key={s} value={s}>
                  {s < 60 ? `${s} segundos` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min`}
                </option>
              ))}
            </select>
            <span className="hint">Empieza al marcar una serie como hecha.</span>
          </div>
          <div className="field">
            <label htmlFor="inc">Aumento de peso sugerido</label>
            <select id="inc" className="select" value={settings.increment} onChange={(e) => set({ increment: Number(e.target.value) })}>
              {[1, 1.25, 2, 2.5, 5].map((v) => (
                <option key={v} value={v}>
                  {String(v).replace(".", ",")} kg
                </option>
              ))}
            </select>
            <span className="hint">Cuánto subir cuando llegas al tope de repeticiones.</span>
          </div>
        </div>
      </section>

      <section className="section panel">
        <h2>Tus datos</h2>
        <p className="hint">
          Todo se guarda en este navegador. Descarga un respaldo de vez en cuando, y úsalo para pasar tus datos a otro equipo.
        </p>
        {!api.isPersistent && (
          <p className="error-text">Este navegador no permite guardar datos (¿modo privado?). Lo que registres se perderá al cerrar la pestaña.</p>
        )}
        <div className="btn-row">
          <button className="btn" onClick={async () => download(`crasher-respaldo-${todayISO()}.json`, await api.backup.exportJSON(), "application/json")}>
            <Icon name="download" /> Descargar respaldo (JSON)
          </button>
          <button
            className="btn"
            disabled={!sessions.length}
            onClick={async () => download(`crasher-series-${todayISO()}.csv`, "﻿" + (await api.backup.exportCSV()), "text/csv;charset=utf-8")}
          >
            <Icon name="download" /> Exportar series (CSV)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" /> Importar respaldo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const ok = await confirm({
                title: "¿Importar este respaldo?",
                message:
                  "Si es un respaldo de esta versión, reemplazará tus rutinas e historial actuales. Si es de la versión anterior de Crasher, se agregará como una rutina más.",
                confirmLabel: "Importar",
              });
              if (!ok) return;
              const text = await file.text();
              run(() => api.backup.importJSON(text), (r) => `Respaldo importado: ${r.sessions} entrenamientos.`);
            }}
          />
        </div>
      </section>

      <section className="section panel danger-zone">
        <h2>Borrar datos</h2>
        <div className="btn-row">
          <button
            className="btn btn-danger"
            disabled={!sessions.length}
            onClick={async () => {
              const ok = await confirm({
                title: "¿Borrar todo el historial?",
                message: "Se eliminan todos los entrenamientos registrados. Tus rutinas se mantienen. No se puede deshacer.",
                confirmLabel: "Borrar historial",
                danger: true,
              });
              if (ok) run(() => api.sessions.clear(), "Historial borrado");
            }}
          >
            Borrar historial
          </button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              const ok = await confirm({
                title: "¿Borrar todos los datos?",
                message: "Se eliminan rutinas, ejercicios creados por ti e historial. La app queda como recién instalada. No se puede deshacer.",
                confirmLabel: "Borrar todo",
                danger: true,
              });
              if (ok) {
                await run(() => api.backup.resetAll());
                toast("Se borraron todos los datos");
              }
            }}
          >
            Borrar todo
          </button>
        </div>
      </section>

      <p className="hint about">
        Crasher 2.0. Videos de técnica: Enciclopedia de Ejercicios, Manuel Escalera.
      </p>
    </>
  );
}
