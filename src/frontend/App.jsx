import { useEffect } from "react";
import { useData } from "./store.jsx";
import { Link, match, navigate, usePath } from "./router.jsx";
import { Icon } from "./icons.jsx";
import { Plate } from "./components/Plate.jsx";
import { TrainPage } from "./pages/TrainPage.jsx";
import { WorkoutPage } from "./pages/WorkoutPage.jsx";
import { RoutinesPage } from "./pages/RoutinesPage.jsx";
import { RoutineEditor } from "./pages/RoutineEditor.jsx";
import { ExercisesPage } from "./pages/ExercisesPage.jsx";
import { ProgressPage } from "./pages/ProgressPage.jsx";
import { HistoryPage } from "./pages/HistoryPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { VolumeGuidePage } from "./pages/VolumeGuidePage.jsx";

const NAV = [
  { to: "/entrenar", label: "Entrenar", icon: "dumbbell" },
  { to: "/rutinas", label: "Rutinas", icon: "list" },
  { to: "/ejercicios", label: "Ejercicios", icon: "book" },
  { to: "/progreso", label: "Progreso", icon: "chart" },
  { to: "/historial", label: "Historial", icon: "clock" },
];

// Rutas: [patrón, título, botón atrás, componente]
const ROUTES = [
  ["/entrenar", "Entrenar", null, () => <TrainPage />],
  ["/entrenar/:routineId/:dayId", "Entrenamiento", "/entrenar", (p) => <WorkoutPage key={p.dayId} {...p} />],
  ["/rutinas", "Rutinas", null, () => <RoutinesPage />],
  ["/rutinas/:id", "Editar rutina", "/rutinas", (p) => <RoutineEditor key={p.id} {...p} />],
  ["/ejercicios", "Ejercicios", null, () => <ExercisesPage />],
  ["/progreso", "Progreso", null, () => <ProgressPage />],
  ["/historial", "Historial", null, () => <HistoryPage />],
  ["/ajustes", "Ajustes", null, () => <SettingsPage />],
  ["/volumen", "Guía de volumen", "/progreso", () => <VolumeGuidePage />],
];

export function App() {
  const { ready, settings, api, run } = useData();
  const path = usePath();

  let found = null;
  for (const [pattern, title, back, render] of ROUTES) {
    const params = match(pattern, path);
    if (params) {
      found = { title, back, render, params };
      break;
    }
  }

  useEffect(() => {
    if (!found) navigate("/entrenar", { replace: true });
    document.title = found ? `${found.title} · Crasher` : "Crasher";
  }, [found?.title, path]);

  const section = "/" + (path.split("/")[1] || "entrenar");
  const pref = settings?.theme || "system";
  const resolved = pref === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : pref;

  return (
    <div className="app">
      <header className="topbar">
        {found?.back && (
          <Link className="icon-btn back-btn" to={found.back} aria-label="Volver">
            <Icon name="left" />
          </Link>
        )}
        <span className="topbar-title">{found?.title || ""}</span>
        <button
          className="icon-btn"
          onClick={() => run(() => api.settings.save({ theme: resolved === "dark" ? "light" : "dark" }))}
          aria-label={resolved === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={resolved === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          <Icon name={resolved === "dark" ? "sun" : "moon"} />
        </button>
        <Link className="icon-btn" to="/ajustes" aria-label="Ajustes" aria-current={section === "/ajustes" ? "page" : undefined}>
          <Icon name="settings" />
        </Link>
      </header>

      <main className="main" id="main">
        {ready && settings ? found?.render(found.params) : <p className="hint center">Cargando…</p>}
      </main>

      <nav className="bottomnav" aria-label="Secciones">
        <Link className="brand" to="/entrenar">
          <Plate index={0} size={28} /> Crasher
        </Link>
        {NAV.map((n) => (
          <Link key={n.to} className="navlink" to={n.to} aria-current={section === n.to ? "page" : undefined}>
            <Icon name={n.icon} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
