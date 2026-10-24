// Disco de pesas: identifica cada día de la rutina con un color fijo
// (rojo, azul, amarillo, verde, morado; del 6º día en adelante, gris).
// El color nunca va solo: el nombre del día siempre aparece al lado.

export function plateColor(index) {
  return index >= 0 && index < 5 ? `var(--plate-${index + 1})` : "var(--plate-other)";
}

export function Plate({ index = 0, size = 40 }) {
  const c = plateColor(index);
  return (
    <svg className="plate" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill={c} />
      <circle cx="20" cy="20" r="13.5" fill="none" stroke="var(--plate-hole)" strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="5" fill="var(--plate-hole)" />
    </svg>
  );
}
