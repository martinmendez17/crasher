// Guía de entrenamiento: tabla de volumen por músculo, objetivos (fuerza / hipertrofia) y cómo usarlos.

import { useMemo } from "react";
import { useData } from "../store.jsx";
import { MUSCLES } from "../../backend/data/catalogs.js";
import { LANDMARKS, VOLUME_SOURCE, rangeText, freqText } from "../../backend/data/volumeLandmarks.js";
import { weeklyVolume, volumeZone } from "../../backend/domain/volume.js";
import { ZoneBadge } from "../components/VolumeBars.jsx";
import { fmtNum } from "../format.js";
import { GOAL_LIST, REPS_ALERT_MESSAGE } from "../../backend/data/trainingGoals.js";

const TERMS = [
  ["MV", "Volumen de mantenimiento", "Lo mínimo para no perder músculo ni fuerza. Útil en semanas de descarga o cuando priorizas otro músculo."],
  ["MEV", "Mínimo volumen efectivo", "Desde aquí el músculo empieza a crecer. Por debajo, solo mantienes."],
  ["MAV", "Máximo volumen adaptativo", "El rango donde más se progresa. Es la zona óptima donde conviene pasar la mayor parte del tiempo."],
  ["MRV", "Máximo volumen recuperable", "El límite de lo que puedes recuperar. Si lo pasas se acumula fatiga, tu rendimiento baja y sube el riesgo de lesión."],
];

export function VolumeGuidePage() {
  const { sessions, exById } = useData();
  const week = useMemo(() => weeklyVolume(sessions, exById, 7), [sessions, exById]);
  const rows = MUSCLES.filter((m) => LANDMARKS[m.id]);

  return (
    <div className="guide">
      <p className="page-lead">
        Cuántas <strong>series efectivas por semana</strong> conviene hacer para cada músculo. Una serie efectiva es
        una serie de trabajo hecha cerca del fallo (te quedan 0 a 3 repeticiones en reserva). Los calentamientos no
        cuentan.
      </p>

      <dl className="terms">
        {TERMS.map(([abbr, name, text]) => (
          <div key={abbr} className="term">
            <dt>
              <abbr title={name}>{abbr}</abbr> <span>{name}</span>
            </dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>

      <section className="section">
        <div className="section-head stack">
          <h2>Tabla de referencia</h2>
          <p>Series por semana. La columna “Tu semana” muestra lo que registraste en los últimos 7 días.</p>
        </div>
        <div className="table-wrap guide-table">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Músculo</th>
                <th scope="col">Tu semana</th>
                <th scope="col" className="n"><abbr title="Volumen de mantenimiento">MV</abbr></th>
                <th scope="col" className="n"><abbr title="Mínimo volumen efectivo">MEV</abbr></th>
                <th scope="col" className="n"><abbr title="Máximo volumen adaptativo">MAV</abbr></th>
                <th scope="col" className="n"><abbr title="Máximo volumen recuperable">MRV</abbr></th>
                <th scope="col">Frecuencia</th>
                <th scope="col">Reps</th>
                <th scope="col">RIR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const L = LANDMARKS[m.id];
                const v = week.sets[m.id] || 0;
                return (
                  <tr key={m.id}>
                    <th scope="row">{m.label}</th>
                    <td>
                      <span className="num week-val">{fmtNum(v, 1)}</span> <ZoneBadge zone={volumeZone(m.id, v)} />
                    </td>
                    <td className="n">{rangeText(L.mv)}</td>
                    <td className="n">{rangeText(L.mev)}</td>
                    <td className="n mav">{rangeText(L.mav)}</td>
                    <td className="n">{L.mrv}+</td>
                    <td>{freqText(L.freq)}/sem</td>
                    <td>{L.reps}</td>
                    <td>{L.rir}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head stack">
          <h2>Fuerza o hipertrofia</h2>
          <p>Cada día de tu rutina tiene un objetivo. Lo eliges en el editor de rutinas y define la carga y las repeticiones.</p>
        </div>
        <div className="table-wrap guide-table">
          <table className="data goals-table">
            <thead>
              <tr>
                <th scope="col">Objetivo</th>
                <th scope="col">Carga</th>
                <th scope="col">Repeticiones</th>
              </tr>
            </thead>
            <tbody>
              {GOAL_LIST.map((g) => (
                <tr key={g.id}>
                  <td>
                    <span className={`badge goal-${g.id}`}>{g.label}</span>
                  </td>
                  <td>{g.load}</td>
                  <td>{g.repsText}</td>
                </tr>
              ))}
              <tr>
                <td>Fuerza-resistencia</td>
                <td>Ligera-moderada (40-60 % 1RM)</td>
                <td>Más de 15</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="hint guide-note">
          Sobre 15 repeticiones ya no ganas fuerza ni músculo, y la app te avisa: “{REPS_ALERT_MESSAGE}”. Los ejercicios de
          core que se miden en segundos, como la plancha, no cuentan.
        </p>
      </section>

      <section className="section panel">
        <h2>Cómo usarla</h2>
        <ul className="guide-list">
          <li>Empieza cerca del <strong>MEV</strong> y sube 1 o 2 series por semana hacia el <strong>MAV</strong> mientras sigas progresando.</li>
          <li>Si llegas al <strong>MRV</strong>, tu rendimiento baja o andas con fatiga general: haz una semana de descarga cerca del <strong>MV</strong> y vuelve a empezar.</li>
          <li>Reparte las series en la <strong>frecuencia</strong> indicada: 16 series en 2 días rinden más que 16 series en un solo día.</li>
          <li>La app cuenta cada serie para el <strong>músculo principal</strong> del ejercicio. Un press de banca suma a pecho, aunque también trabaje tríceps y hombro.</li>
          <li>Métodos de alta intensidad como <strong>Heavy Duty</strong> usan a propósito muy pocas series al fallo total. Estas referencias no aplican igual a ese estilo.</li>
        </ul>
        <p className="hint source">Fuente: {VOLUME_SOURCE} Aductores no tiene referencia en la tabla.</p>
      </section>
    </div>
  );
}
