// Estado global del frontend.
// Carga los datos desde la API del backend y los reparte a las pantallas.
// Las pantallas llaman a api.* y luego a reload() para refrescar.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../backend/api.js";
import { Sheet } from "./components/Sheet.jsx";

const Ctx = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState({ ready: false });
  const [toastMsg, setToastMsg] = useState(null);
  const [dialog, setDialog] = useState(null);
  const toastTimer = useRef(null);

  const reload = useCallback(async () => {
    const [exercises, templates, routines, activeRoutineId, sessions, settings, draft] = await Promise.all([
      api.exercises.list(),
      api.templates.list(),
      api.routines.list(),
      api.routines.getActiveId(),
      api.sessions.list(),
      api.settings.get(),
      api.draft.get(),
    ]);
    setData({
      ready: true,
      exercises,
      exById: new Map(exercises.map((e) => [e.id, e])),
      templates,
      routines,
      activeRoutineId,
      sessions,
      settings,
      draft,
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Tema claro / oscuro
  const theme = data.settings?.theme || "system";
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const t = theme === "system" ? (mq.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = t;
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
        m.setAttribute("content", t === "dark" ? "#17191C" : "#F2F3F5");
      });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const toast = useCallback((text, kind = "info") => {
    clearTimeout(toastTimer.current);
    setToastMsg({ text, kind, key: Date.now() });
    toastTimer.current = setTimeout(() => setToastMsg(null), kind === "error" ? 5000 : 2800);
  }, []);

  /** Ejecuta una acción de la API, recarga y muestra el resultado. */
  const run = useCallback(
    async (fn, okMessage) => {
      try {
        const res = await fn();
        await reload();
        if (okMessage) toast(typeof okMessage === "function" ? okMessage(res) : okMessage);
        return res;
      } catch (err) {
        toast(err?.message || "Algo falló. Inténtalo de nuevo.", "error");
        return undefined;
      }
    },
    [reload, toast],
  );

  /** Diálogo de confirmación. Devuelve una Promise<boolean>. */
  const confirm = useCallback(
    ({ title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", danger = false }) =>
      new Promise((resolve) => {
        setDialog({ title, message, confirmLabel, cancelLabel, danger, resolve });
      }),
    [],
  );

  const closeDialog = (value) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  const value = useMemo(() => ({ ...data, reload, run, toast, confirm, api }), [data, reload, run, toast, confirm]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && (
        <div key={toastMsg.key} className={`toast ${toastMsg.kind === "error" ? "error" : ""}`} role="status" aria-live="polite">
          {toastMsg.text}
        </div>
      )}
      {dialog && (
        <Sheet
          title={dialog.title}
          onClose={() => closeDialog(false)}
          footer={
            <>
              <button className="btn" onClick={() => closeDialog(false)}>
                {dialog.cancelLabel}
              </button>
              <button className={`btn ${dialog.danger ? "btn-danger" : "btn-primary"}`} onClick={() => closeDialog(true)} autoFocus>
                {dialog.confirmLabel}
              </button>
            </>
          }
        >
          <p>{dialog.message}</p>
        </Sheet>
      )}
    </Ctx.Provider>
  );
}

export function useData() {
  return useContext(Ctx);
}
