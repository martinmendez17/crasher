// Progreso: resumen, evolución por ejercicio y series semanales por músculo.

import { useMemo, useState } from "react";
import { useData } from "../store.jsx";
import { Link } from "../router.jsx";
import { LineChart } from "../components/LineChart.jsx";
import { MUSCLES } from "../../backend/data/catalogs.js";
import { METRICS, exerciseSeries, linearRegression, loggedExercises, setsByMuscle, summary } from "../../backend/domain/stats.js";
import { fmtTonnage, fmtNum, fmtDate, relDay } from "../format.js";

export function ProgressPage() {
  const { sessions } = useData();
  const list = useMemo(() => loggedExercises(sessions), [sessions]);
  const [exName, setExName] = useState(null);
  const [metric, setMetric] = useState("maxWeight");
  const [showTable, setShowTable] = useState(false);
  const current = exName && list.some((e) => e.name === exName) ? exName : list[0]?.name;

  const sum = useMemo(() => summary(sessions), [sessions]);
  const weekly = useMemo(() => setsByMuscle(sessions, 7), [sessions]);
  const points = useMemo(() => (current ? exerciseSeries(sessions, current, metric) : []), [sessions, current, metric]);
  const trend = useMemo(() => linearRegression(points), [points]);
  const metricInfo = METRICS.find((m) => m.id === metric);

  if (!sessions.length) {
    return (
      <div className="empty">
        <h2>Aquí verás tu progreso</h2>
        <p>Cuando guardes tu primer entrenamiento, aparecerán tus marcas, la evolución de cada ejercicio y tus series por músculo.</p>
        <Link className="btn btn-primary" to="/entrenar">
          Ir a entrenar
        </Link>
      </div>
    );
  }

  const last = points[points.length - 1]?.y ?? 0;
  const prev = points.length > 1 ? points[points.length - 2].y : null;
  const best = points.length ? Math.max(...points.map((p) => p.y)) : 0;
  const diff = prev === null ? null : Math.round((last - prev) * 10) / 10;
  const maxWeekly = Math.max(20, ...Object.values(weekly));

  return (
    <>
      <section className="section">
        <div className="stats">
          <div className="stat">
            <span className="num">{sum.last30}</span>
            <span>Entrenamientos en 30 días</span>
          </div>
          <div className="stat">
            <span className="num">{sum.sessions}</span>
            <span>Entrenamientos en total</span>
          </div>
          <div className="stat">
            <span className="num">{sum.sets}</span>
            <span>Series registradas</span>
          </div>
          <div className="stat">
            <span className="num">{fmtTonnage(sum.tonnage)}</span>
            <span>Peso total levantado</span>
          </div>
        </div>
      </section>

      <section className="section panel">
        <div className="section-head stack">
          <h2>Evolución por ejercicio</h2>
        </div>
        <div className="progress-controls">
          <div className="field">
            <label htmlFor="pg-ex">Ejercicio</label>
            <select id="pg-ex" className="select" value={current} onChange={(e) => setExName(e.target.value)}>
              {list.map((e) => (
                <option key={e.name} value={e.name}>
                  {e.name} ({e.count})
                </option>
              ))}
            </select>
          </div>
          <div className="segmented" role="group" aria-label="Métrica">
            {METRICS.map((m) => (
              <button key={m.id} aria-pressed={metric === m.id} onClick={() => setMetric(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="progress-figures">
          <div>
            <span className="label">Última</span>
            <span className="num big">
              {fmtNum(last)} <small>kg</small>
            </span>
            {diff !== null && (
              <span className={`delta ${diff > 0 ? "up" : diff < 0 ? "down" : ""}`}>
                {diff > 0 ? `▲ +${fmtNum(diff)}` : diff < 0 ? `▼ ${fmtNum(diff)}` : "= igual"} vs. anterior
              </span>
            )}
          </div>
          <div>
            <span className="label">Mejor marca</span>
            <span className="num big">
              {fmtNum(best)} <small>kg</small>
            </span>
          </div>
          <div>
            <span className="label">Tendencia</span>
            <span className="num big">
              {points.length >= 3 ? `${trend.slope >= 0 ? "+" : ""}${fmtNum(trend.slope)}` : "—"} <small>kg/sesión</small>
            </span>
          </div>
        </div>

        <LineChart points={points} trend={trend} unit="kg" label={`${metricInfo.long} de ${current} por sesión`} />
        <p className="hint chart-legend">
          <span className="key-line" /> {metricInfo.long} por sesión
          {points.length >= 3 && (
            <>
              <span className="key-dash" /> Tendencia
            </>
          )}
        </p>

        <button className="btn btn-sm" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
          {showTable ? "Ocultar tabla" : "Ver como tabla"}
        </button>
        {showTable && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th className="n">{metricInfo.long}</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p, i) => (
                  <tr key={i}>
                    <td>{fmtDate(p.date, { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="n">{fmtNum(p.y)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section panel">
        <div className="section-head stack">
          <h2>Series por músculo, últimos 7 días</h2>
          <p>La zona verde marca el rango que suele recomendarse para ganar músculo: entre 10 y 20 series por semana.</p>
        </div>
        <div className="bars" role="list">
          {MUSCLES.map((m) => {
            const v = weekly[m.id] || 0;
            const status = v === 0 ? "" : v < 10 ? "Bajo el rango" : v > 20 ? "Sobre el rango" : "En rango";
            return (
              <div key={m.id} className="bar-row" role="listitem">
                <span className="bar-label">{m.label}</span>
                <span className="bar-track">
                  <span className="bar-band" style={{ left: `${(10 / maxWeekly) * 100}%`, width: `${(10 / maxWeekly) * 100}%` }} />
                  {v > 0 && <span className="bar-fill" style={{ width: `${(v / maxWeekly) * 100}%` }} />}
                </span>
                <span className="bar-value num">{v}</span>
                <span className="visually-hidden">{status}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Ejercicios registrados</h2>
        </div>
        <div className="list">
          {list.slice(0, 12).map((e) => (
            <button key={e.name} className="list-row" onClick={() => { setExName(e.name); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <span className="grow">
                <span className="row-title">{e.name}</span>
                <span className="row-sub block">
                  {e.count} {e.count === 1 ? "sesión" : "sesiones"}, última {relDay(e.last)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
