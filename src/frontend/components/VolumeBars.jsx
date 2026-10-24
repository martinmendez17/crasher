// Barras de volumen semanal por músculo sobre las zonas de referencia
// (efectivo, óptimo, alto, excesivo). La zona siempre va escrita, no solo en color.

import { MUSCLES } from "../../backend/data/catalogs.js";
import { LANDMARKS, rangeText, freqText } from "../../backend/data/volumeLandmarks.js";
import { ZONES, volumeZone, volumeAdvice, frequencyStatus } from "../../backend/domain/volume.js";
import { fmtNum } from "../format.js";

const TONE_CLASS = { neutral: "", info: "info", success: "success", warning: "warning", danger: "danger" };

export function ZoneBadge({ zone }) {
  if (!zone) return null;
  const z = ZONES[zone];
  return <span className={`badge ${TONE_CLASS[z.tone]}`}>{z.short}</span>;
}

/**
 * @param sets   { muscle: series }
 * @param freq   { muscle: veces por semana }
 * @param mode   "week" (lo que hiciste) | "plan" (lo que planificaste)
 * @param onlyUsed  muestra solo los músculos con series
 */
export function VolumeBars({ sets = {}, freq = {}, mode = "week", onlyUsed = false }) {
  const values = Object.values(sets);
  const scale = Math.max(30, ...values.map((v) => v + 2));
  const pct = (v) => `${Math.min(100, (v / scale) * 100)}%`;

  const muscles = MUSCLES.filter((m) => LANDMARKS[m.id] && (!onlyUsed || sets[m.id] > 0));
  const noRef = MUSCLES.filter((m) => !LANDMARKS[m.id] && sets[m.id] > 0);

  return (
    <div className="vol">
      {muscles.map((m) => {
        const L = LANDMARKS[m.id];
        const v = sets[m.id] || 0;
        const zone = volumeZone(m.id, v);
        const advice = volumeAdvice(m.id, v);
        const showAdvice = mode === "plan" ? !!advice && v > 0 : zone === "over" || zone === "high";
        const fs = frequencyStatus(m.id, freq[m.id]);
        return (
          <div key={m.id} className={`vol-row zone-${zone}`}>
            <div className="vol-head">
              <span className="vol-name">{m.label}</span>
              <span className="vol-value num">
                {fmtNum(v, 1)} <small>{v === 1 ? "serie" : "series"}</small>
              </span>
              <ZoneBadge zone={zone} />
            </div>
            <div
              className="vol-track"
              role="img"
              aria-label={`${m.label}: ${fmtNum(v, 1)} series por semana. ${ZONES[zone].label}. Óptimo ${rangeText(L.mav)}, máximo recuperable ${L.mrv}.`}
            >
              <span className="band eff" style={{ left: pct(Math.max(1, L.mev[0])), width: `calc(${pct(L.mav[0])} - ${pct(Math.max(1, L.mev[0]))})` }} />
              <span className="band opt" style={{ left: pct(L.mav[0]), width: `calc(${pct(L.mav[1])} - ${pct(L.mav[0])})` }} />
              <span className="band high" style={{ left: pct(L.mav[1]), width: `calc(${pct(L.mrv)} - ${pct(L.mav[1])})` }} />
              <span className="band over" style={{ left: pct(L.mrv), right: 0 }} />
              {v > 0 && <span className="vol-fill" style={{ width: pct(v) }} />}
            </div>
            <div className="vol-meta">
              <span>
                Óptimo {rangeText(L.mav)}, máximo {L.mrv}
              </span>
              {freq[m.id] > 0 && (
                <span className={fs === "low" ? "freq-low" : ""}>
                  {fmtNum(freq[m.id], 1)} {freq[m.id] === 1 ? "día" : "días"}/sem
                  {fs === "low" ? ` (recomendado ${freqText(L.freq)})` : ""}
                </span>
              )}
            </div>
            {showAdvice && <p className="vol-advice">{advice}</p>}
          </div>
        );
      })}
      {noRef.length > 0 && (
        <p className="hint">
          {noRef.map((m) => `${m.label}: ${fmtNum(sets[m.id], 1)} series`).join(", ")}. La tabla de referencia no incluye este músculo.
        </p>
      )}
      <VolumeLegend mode={mode} />
    </div>
  );
}

export function VolumeLegend({ mode }) {
  return (
    <div className="vol-legend" aria-hidden="true">
      <span><i className="sw eff" /> Efectivo</span>
      <span><i className="sw opt" /> Óptimo</span>
      <span><i className="sw high" /> Alto</span>
      <span><i className="sw over" /> Sobrefatiga</span>
      <span><i className="sw ink" /> {mode === "plan" ? "Series planificadas" : "Tus series"}</span>
    </div>
  );
}
