// Gráfico de línea (una sola serie) con línea de tendencia y tooltip.
// SVG puro: sin librerías.

import { useLayoutEffect, useMemo, useRef, useState } from "react";

const H = 220;
const PAD = { l: 40, r: 14, t: 22, b: 30 };

function niceTicks(min, max, count = 4) {
  if (min === max) {
    const d = Math.max(1, Math.abs(min) * 0.1);
    min -= d;
    max += d;
  }
  const span = max - min;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { lo, hi, ticks };
}

const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
};

export function LineChart({ points, trend, unit = "kg", label }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const boxRef = useRef(null);
  const [W, setW] = useState(640);

  // El SVG se dibuja al ancho real del contenedor para que el texto no se achique
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(260, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const ys = points.map((p) => p.y);
    const { lo, hi, ticks } = niceTicks(Math.min(...ys), Math.max(...ys));
    const iw = W - PAD.l - PAD.r;
    const ih = H - PAD.t - PAD.b;
    const x = (i) => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
    const y = (v) => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
    return { ticks, x, y };
  }, [points, W]);

  if (!points.length) return null;
  const { ticks, x, y } = geo;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  const showTrend = trend && points.length >= 3;
  const labelIdx = new Set([0, points.length - 1]);
  if (points.length > 2) labelIdx.add(points.reduce((bi, p, i) => (p.y > points[bi].y ? i : bi), 0));

  const onMove = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setHover(best);
  };

  const hp = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? (x(hover) / W) * 100 : 0;

  return (
    <div className="chart" ref={boxRef}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label={label}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth="1" />
            <text x={PAD.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="chart-axis">
              {t}
            </text>
          </g>
        ))}
        {[0, points.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor={points.length === 1 ? "middle" : i === 0 ? "start" : "end"} className="chart-axis">
            {fmtDate(points[i].date)}
          </text>
        ))}
        {showTrend && (
          <line
            x1={x(0)}
            y1={y(trend.slope * 1 + trend.intercept)}
            x2={x(points.length - 1)}
            y2={y(trend.slope * points.length + trend.intercept)}
            stroke="var(--chart-trend)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
        )}
        <path d={path} fill="none" stroke="var(--chart-line)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--border-strong)" strokeWidth="1" />}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.y)} r={hover === i ? 6 : 4.5} fill="var(--chart-line)" stroke="var(--surface)" strokeWidth="2" />
        ))}
        {points.map((p, i) =>
          labelIdx.has(i) && hover === null ? (
            <text key={"l" + i} x={x(i)} y={y(p.y) - 12} textAnchor={i === 0 && points.length > 1 ? "start" : i === points.length - 1 && points.length > 1 ? "end" : "middle"} className="chart-value">
              {p.y}
            </text>
          ) : null,
        )}
      </svg>
      {hp && (
        <div className="chart-tip" style={{ left: `${Math.min(Math.max(tipLeft, 12), 88)}%` }}>
          <strong className="num">
            {hp.y} {unit}
          </strong>
          <span>{fmtDate(hp.date)}</span>
        </div>
      )}
    </div>
  );
}
