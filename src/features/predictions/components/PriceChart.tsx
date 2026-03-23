'use client';
import { useCallback,useRef, useState } from 'react';

import { usePredictionChart } from '@/features/predictions/queries';

import { probColor } from './utils';

const MIN_W = 220, MIN_H = 80, MAX_W = 900, MAX_H = 400;
const PAD   = { top: 12, right: 12, bottom: 22, left: 36 };

// SVG <text> can't use className directly for font-family in all renderers,
// so we define the font string once as a constant scoped to this file.
// This is the only permitted exception to the no-font-string rule (CODEX §1.3).
const SVG_FONT = 'SFMono-Regular, Menlo, monospace';

type Props = { yesTokenId: string };

function Placeholder({ msg, w, h }: { msg: string; w: number; h: number }) {
  return (
    <div style={{ width: w, height: h + 24 }} className="flex flex-col gap-1">
      <span className="mono label">PRICE HISTORY</span>
      <div className="flex flex-1 items-center justify-center border border-[var(--bd)] rounded-[2px]">
        <span className="mono label">{msg}</span>
      </div>
    </div>
  );
}

export function PriceChart({ yesTokenId }: Props) {
  const { data: chartData, isLoading: loading, isError: error } = usePredictionChart(yesTokenId ?? '');
  const history = chartData?.history ?? [];
  const [size,     setSize]     = useState({ w: 360, h: 130 });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const svgRef    = useRef<SVGSVGElement>(null);
  const resizeRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  const onResizeDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, sw: size.w, sh: size.h };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const nw = Math.max(MIN_W, Math.min(MAX_W, resizeRef.current.sw + ev.clientX - resizeRef.current.sx));
      const nh = Math.max(MIN_H, Math.min(MAX_H, resizeRef.current.sh + ev.clientY - resizeRef.current.sy));
      setSize({ w: nw, h: nh });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || history.length < 2) return;
    const rect   = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pts    = history;
    const minT   = pts[0].t, maxT = pts[pts.length - 1].t;
    const cW     = size.w - PAD.left - PAD.right;
    const ratio  = (mouseX - PAD.left) / cW;
    const tAtX   = minT + ratio * (maxT - minT);
    let lo = 0, hi = pts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].t < tAtX) lo = mid + 1; else hi = mid;
    }
    const idx = lo > 0 && Math.abs(pts[lo - 1].t - tAtX) < Math.abs(pts[lo].t - tAtX) ? lo - 1 : lo;
    setHoverIdx(idx);
  }, [history, size.w]);

  const { w, h } = size;
  const chartW   = w - PAD.left - PAD.right;
  const chartH   = h - PAD.top  - PAD.bottom;
  const gradId   = `fill-${yesTokenId.slice(-8)}`;

  if (!yesTokenId) return <Placeholder msg="NO PRICE HISTORY" w={w} h={h} />;
  if (loading) return <Placeholder msg="LOADING CHART..." w={w} h={h} />;
  if (error || history.length < 2) return <Placeholder msg="NO PRICE HISTORY" w={w} h={h} />;

  const pts    = history;
  const minT   = pts[0].t, maxT = pts[pts.length - 1].t;
  const lastP  = pts[pts.length - 1].p;
  const firstP = pts[0].p;
  const change = lastP - firstP;
  const color  = probColor(lastP);

  const scaleX = (t: number) => PAD.left + ((t - minT) / (maxT - minT || 1)) * chartW;
  const scaleY = (p: number) => PAD.top  + (1 - p) * chartH;

  const linePts  = pts.map(pt => `${scaleX(pt.t).toFixed(1)},${scaleY(pt.p).toFixed(1)}`).join(' ');
  const areaPath = [
    `M ${scaleX(pts[0].t).toFixed(1)} ${(PAD.top + chartH).toFixed(1)}`,
    ...pts.map(pt => `L ${scaleX(pt.t).toFixed(1)} ${scaleY(pt.p).toFixed(1)}`),
    `L ${scaleX(pts[pts.length - 1].t).toFixed(1)} ${(PAD.top + chartH).toFixed(1)}`, 'Z',
  ].join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const hPt      = hoverIdx !== null ? pts[hoverIdx] : null;
  const hX       = hPt ? scaleX(hPt.t) : null;
  const hY       = hPt ? scaleY(hPt.p) : null;
  const hColor   = hPt ? probColor(hPt.p) : color;
  const hDate    = hPt ? new Date(hPt.t * 1000) : null;
  const hDelta   = hPt ? hPt.p - firstP : null;
  const tooltipLeft = hX !== null && hX > w / 2;

  return (
    <div className="flex flex-col gap-1 select-none">
      {/* ── Header row ── */}
      <div className="flex items-center gap-2.5">
        <span className="mono label">PRICE HISTORY</span>
        <span
          className="mono text-[length:var(--text-caption)] font-bold tracking-[0.06em]"
          style={{ color: change >= 0 ? 'var(--success)' : 'var(--danger)' }}
        >
          {change >= 0 ? '+' : ''}{(change * 100).toFixed(1)}%
        </span>
        {hPt && hDate && (
          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)] ml-1">
            {hDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
            {' '}{hDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {'  '}<span className="font-bold" style={{ color: hColor }}>{Math.round(hPt.p * 100)}%</span>
          </span>
        )}
        <span className="mono ml-auto text-[length:var(--text-caption)] text-[var(--t4)] opacity-50">{pts.length} pts</span>
      </div>

      {/* ── SVG chart ── */}
      <div className="relative" style={{ width: w, height: h }}>
        <svg
          ref={svgRef}
          width={w} height={h}
          className="block cursor-crosshair"
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
            <clipPath id={`clip-${gradId}`}>
              <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {/* Grid */}
          <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} fill="none" stroke="var(--bd)" strokeWidth={0.5} />
          {gridLines.map(g => (
            <g key={g}>
              <line x1={PAD.left} y1={scaleY(g)} x2={w - PAD.right} y2={scaleY(g)}
                stroke="var(--bd)" strokeWidth={0.5}
                strokeDasharray={g === 0 || g === 1 ? 'none' : '3,4'} />
              <text x={PAD.left - 5} y={scaleY(g) + 3.5} fontSize={7} fill="var(--t4)"
                textAnchor="end" fontFamily={SVG_FONT}>
                {Math.round(g * 100)}
              </text>
            </g>
          ))}

          {/* Area + line */}
          <g clipPath={`url(#clip-${gradId})`}>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <polyline points={linePts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          </g>

          {/* Last price dot (when not hovering) */}
          {hoverIdx === null && (
            <circle cx={scaleX(pts[pts.length - 1].t)} cy={scaleY(lastP)} r={3}
              fill={color} stroke="var(--bg-2)" strokeWidth={1.5} />
          )}

          {/* X-axis date labels */}
          {[pts[0], pts[Math.floor(pts.length / 2)], pts[pts.length - 1]].map((pt, i) => {
            const x   = scaleX(pt.t);
            const lbl = new Date(pt.t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
            return (
              <text key={i} x={x} y={h - 5} fontSize={7} fill="var(--t4)"
                textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
                fontFamily={SVG_FONT}>
                {lbl}
              </text>
            );
          })}

          {/* Crosshair */}
          {hX !== null && hY !== null && (
            <>
              <line x1={hX} y1={PAD.top} x2={hX} y2={PAD.top + chartH} stroke="var(--t3)" strokeWidth={1} strokeDasharray="3,3" />
              <line x1={PAD.left} y1={hY} x2={w - PAD.right} y2={hY} stroke={hColor} strokeWidth={0.5} strokeDasharray="2,4" opacity={0.5} />
              <circle cx={hX} cy={hY} r={4} fill={hColor} stroke="var(--bg-1)" strokeWidth={2} />
              <rect x={0} y={hY - 7} width={PAD.left - 2} height={14} rx={1} fill="var(--bg-2)" stroke={hColor} strokeWidth={0.5} />
              <text x={PAD.left - 5} y={hY + 3.5} fontSize={7} fill={hColor}
                textAnchor="end" fontFamily={SVG_FONT} fontWeight="bold">
                {Math.round(hPt!.p * 100)}
              </text>
            </>
          )}
        </svg>

        {/* Hover tooltip */}
        {hX !== null && hY !== null && hPt && hDate && hDelta !== null && (
          <div
            className="absolute pointer-events-none bg-[var(--bg-app)] rounded-[2px] py-[6px] px-2 min-w-[120px] z-10"
            style={{
              top: Math.max(PAD.top, Math.min(h - 80, hY - 40)),
              ...(tooltipLeft ? { right: w - hX + 10 } : { left: hX + 10 }),
              border: `1px solid ${hColor}`,
            }}
          >
            <div className="mono label mb-1">
              {hDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }).toUpperCase()}
              {'  '}{hDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            <div className="flex justify-between items-baseline gap-3">
              <span className="mono label">YES</span>
              <span className="mono text-base font-bold leading-none" style={{ color: hColor }}>
                {Math.round(hPt.p * 100)}%
              </span>
            </div>
            <div
              className="mono mt-1 text-[length:var(--text-tiny)] tracking-[0.04em]"
              style={{ color: hDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}
            >
              {hDelta >= 0 ? '▲' : '▼'} {Math.abs(hDelta * 100).toFixed(1)}% from open
            </div>
          </div>
        )}

        {/* Resize handle */}
        <div
          onMouseDown={onResizeDown}
          className="absolute bottom-0 right-0 flex items-center justify-center w-[14px] h-[14px] cursor-[nwse-resize]"
        >
          <svg width={8} height={8} viewBox="0 0 8 8" fill="none">
            <line x1="2" y1="8" x2="8" y2="2" stroke="var(--t4)" strokeWidth={1.2} />
            <line x1="5" y1="8" x2="8" y2="5" stroke="var(--t4)" strokeWidth={1.2} />
          </svg>
        </div>
      </div>
    </div>
  );
}
