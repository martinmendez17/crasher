// Formatos de texto para la interfaz.

import { daysBetween, todayISO } from "../backend/domain/utils.js";

export function relDay(iso) {
  if (!iso) return "";
  const d = daysBetween(iso, todayISO());
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 0) return fmtDate(iso);
  if (d < 14) return `hace ${d} días`;
  if (d < 60) return `hace ${Math.round(d / 7)} semanas`;
  return fmtDate(iso);
}

export function fmtDate(iso, opts = { day: "numeric", month: "short" }) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", opts);
}

export function fmtDateLong(iso) {
  return fmtDate(iso, { weekday: "long", day: "numeric", month: "long" });
}

export function fmtNum(n, digits = 2) {
  const v = Number(n) || 0;
  return String(parseFloat(v.toFixed(digits)));
}

export function fmtTonnage(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace(".", ",")} t`;
  return `${Math.round(kg)} kg`;
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}
