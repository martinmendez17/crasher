// Aviso de sobrefatiga: músculos sobre el máximo volumen recuperable (o cerca).

import { Icon } from "../icons.jsx";
import { Link } from "../router.jsx";
import { MUSCLE_LABEL } from "../../backend/data/catalogs.js";
import { fmtNum } from "../format.js";

export function FatigueNotice({ warnings, planned = false, showLink = false }) {
  const over = warnings.filter((w) => w.zone === "over");
  const high = warnings.filter((w) => w.zone === "high");
  const list = (ws) => ws.map((w) => `${MUSCLE_LABEL[w.muscle]} (${fmtNum(w.sets, 1)} de ${w.mrv})`).join(", ");
  const danger = over.length > 0;

  return (
    <div className={`notice ${danger ? "notice-danger" : ""}`} role="status">
      <Icon name="alert" />
      <div className="grow">
        {danger ? (
          <>
            <strong>
              {planned ? "Esta rutina pasa" : "Esta semana pasaste"} el máximo volumen recuperable en {list(over)}.
            </strong>{" "}
            {planned
              ? "Para evitar la sobrefatiga, quita series o reparte ese músculo en menos ejercicios."
              : "Para evitar la sobrefatiga, baja series o dale descanso a ese músculo unos días."}
          </>
        ) : (
          <>
            <strong>
              {planned ? "Volumen alto" : "Cerca del límite esta semana"}: {list(high)}.
            </strong>{" "}
            Si notas fatiga acumulada o el rendimiento baja, reduce series.
          </>
        )}
        {danger && high.length > 0 && <div className="row-sub">También cerca del límite: {list(high)}.</div>}
        {showLink && (
          <div>
            <Link to="/progreso">Ver volumen por músculo</Link>
          </div>
        )}
      </div>
    </div>
  );
}
