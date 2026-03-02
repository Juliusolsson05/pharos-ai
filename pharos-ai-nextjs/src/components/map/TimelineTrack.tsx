'use client';

// ─── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  histogram:       number[];
  ticks:           { label: string; pct: number }[];
  leftPct:         number;
  rightPct:        number;
  isActive:        boolean;
  trackRef:        React.RefObject<HTMLDivElement | null>;
  onClick:         (e: React.MouseEvent) => void;
  onHandleDown:    (e: React.MouseEvent, handle: 'left' | 'right' | 'range') => void;
};

const BUCKETS = 80;

// ─── Component ──────────────────────────────────────────────────────────────────

export default function TimelineTrack({ histogram, ticks, leftPct, rightPct, isActive, trackRef, onClick, onHandleDown }: Props) {
  return (
    <div ref={trackRef} className="relative cursor-crosshair" style={{ height: 32 }} onClick={onClick}>
      {/* Histogram bars */}
      {histogram.map((h, i) => {
        const pL = (i / BUCKETS) * 100;
        const inR = !isActive || (pL >= leftPct - 2 && pL <= rightPct + 2);
        return (
          <div key={i} className="absolute bottom-0" style={{
            left: `${pL}%`, width: `${100 / BUCKETS}%`,
            height: `${Math.max(2, h * 28)}px`,
            background: inR ? 'var(--blue)' : 'rgba(95,107,124,0.15)',
            opacity: inR ? 0.7 : 0.25,
          }} />
        );
      })}

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <div key={i} className="absolute top-0 bottom-0" style={{ left: `${t.pct}%` }}>
          <div className="absolute inset-0 w-px bg-[var(--bd)]" />
          <span className="mono absolute text-[7px] text-[var(--t4)]" style={{ top: 0, left: 3 }}>{t.label}</span>
        </div>
      ))}

      {/* Selection overlay */}
      {isActive && (
        <>
          <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: 0, width: `${leftPct}%`, background: 'rgba(0,0,0,0.35)' }} />
          <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${rightPct}%`, right: 0, background: 'rgba(0,0,0,0.35)' }} />
          <div
            className="absolute top-0 bottom-0 cursor-grab"
            style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%`, borderTop: '2px solid var(--blue)', borderBottom: '2px solid var(--blue)' }}
            onMouseDown={e => onHandleDown(e, 'range')}
          />
          <div
            className="absolute top-0 bottom-0 cursor-ew-resize"
            style={{ left: `${leftPct}%`, width: 6, marginLeft: -3, background: 'var(--blue)', borderRadius: 1, opacity: 0.8 }}
            onMouseDown={e => onHandleDown(e, 'left')}
          />
          <div
            className="absolute top-0 bottom-0 cursor-ew-resize"
            style={{ left: `${rightPct}%`, width: 6, marginLeft: -3, background: 'var(--blue)', borderRadius: 1, opacity: 0.8 }}
            onMouseDown={e => onHandleDown(e, 'right')}
          />
        </>
      )}
    </div>
  );
}
