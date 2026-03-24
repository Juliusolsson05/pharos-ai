'use client';

import { useCallback, useMemo } from 'react';

import { Button } from '@/components/ui/button';

import { TimelineTrack } from '@/features/map/components/TimelineTrack';
import { useTimelineDrag } from '@/features/map/hooks/use-timeline-drag';
import type { DataArrays } from '@/features/map/lib/map-filter-engine';

// Types

type Props = {
  rawData?:     DataArrays;
  dataExtent:   [number, number];
  viewExtent:   [number, number];
  onViewExtent: (ext: [number, number]) => void;
  timeRange:    [number, number] | null;
  onTimeRange:  (range: [number, number] | null) => void;
  isMobile?:    boolean;
};

// Constants

const BUCKETS = 80;
const DAY = 86400_000;
const HOUR = 3600_000;

const ZOOM_LEVELS = [
  { label: '24H', ms: 24 * HOUR },
  { label: '3D',  ms: 3 * DAY },
  { label: '7D',  ms: 7 * DAY },
  { label: '2W',  ms: 14 * DAY },
  { label: '1M',  ms: 30 * DAY },
  { label: 'ALL', ms: 0 },
] as const;

function fmt(ms: number) {
  const d = new Date(ms);
  const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${mon} ${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

// Component

export function MapTimeline({ rawData, dataExtent, viewExtent, onViewExtent, timeRange, onTimeRange, isMobile = false }: Props) {

  const [rawMin, rawMax] = viewExtent;
  const [vMin, vMax] = rawMin <= rawMax ? [rawMin, rawMax] : [rawMax, rawMin];
  const span = Math.max(1, vMax - vMin);
  const rngBase = timeRange ?? [vMin, vMax];
  const rng: [number, number] = rngBase[0] <= rngBase[1]
    ? [rngBase[0], rngBase[1]]
    : [rngBase[1], rngBase[0]];
  const isActive = timeRange !== null;

  const { trackRef, handleMouseDown, handleTouchStart, handleClick } = useTimelineDrag(viewExtent, timeRange, onTimeRange);

  const histogram = useMemo(() => {
    const b = new Array(BUCKETS).fill(0);
    if (span <= 0 || !rawData) return b;
    const eventRecords = [...rawData.strikes, ...rawData.missiles, ...rawData.targets];
    const step = span / BUCKETS;
    for (const r of eventRecords) {
      const t = new Date(r.timestamp).getTime();
      if (t < vMin || t > vMax) continue;
      b[Math.min(BUCKETS - 1, Math.max(0, Math.floor((t - vMin) / step)))]++;
    }
    const mx = Math.max(1, ...b);
    return b.map(v => v / mx);
  }, [vMin, vMax, span, rawData]);

  const ticks = useMemo(() => {
    const result: { label: string; pct: number }[] = [];
    const interval = span <= 2 * DAY ? 6 * HOUR : span <= 7 * DAY ? DAY : span <= 60 * DAY ? 7 * DAY : 30 * DAY;
    const start = new Date(vMin);
    if (interval >= DAY) start.setUTCHours(0, 0, 0, 0); else start.setUTCMinutes(0, 0, 0);
    let t = start.getTime();
    while (t <= vMax) {
      const pct = ((t - vMin) / span) * 100;
      if (pct >= 0 && pct <= 100) {
        const d = new Date(t);
        const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
        result.push({ label: interval < DAY ? `${String(d.getUTCHours()).padStart(2, '0')}:00` : `${mon} ${d.getUTCDate()}`, pct });
      }
      t += interval;
    }
    return result;
  }, [vMin, vMax, span]);

  const activeZoom = useMemo(() => {
    const fullSpan = Math.max(1, Math.abs(dataExtent[1] - dataExtent[0]));
    if (Math.abs(span - fullSpan) < 60_000) return 'ALL';
    return ZOOM_LEVELS.find(z => z.ms > 0 && Math.abs(span - z.ms) < 60_000)?.label ?? null;
  }, [span, dataExtent]);

  const handleZoom = useCallback((ms: number) => {
    const [dMinRaw, dMaxRaw] = dataExtent;
    const [dMin, dMax] = dMinRaw <= dMaxRaw ? [dMinRaw, dMaxRaw] : [dMaxRaw, dMinRaw];
    if (ms === 0) { onViewExtent([dMin, dMax]); onTimeRange(null); return; }
    onViewExtent([Math.max(dMin, dMax - ms), dMax]);
    onTimeRange(null);
  }, [dataExtent, onViewExtent, onTimeRange]);

  const toPct = (ms: number) => ((ms - vMin) / span) * 100;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 select-none min-w-0"
      style={{
        background: 'rgba(28,33,39,0.92)',
        borderTop: '1px solid var(--bd)',
        padding: isMobile ? '6px 10px calc(12px + var(--safe-bottom))' : '4px 16px 6px',
        touchAction: 'none',
      }}>
      <div className="flex items-center gap-2 mb-0.5 min-w-0">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto touch-scroll hide-scrollbar pr-2">
          {ZOOM_LEVELS.map(z => (
            <Button key={z.label} variant="ghost" size="xs" onClick={() => handleZoom(z.ms)}
              className={`mono rounded-sm px-1.5 py-0 text-[length:var(--text-tiny)] font-bold tracking-wider ${isMobile ? 'h-5' : 'h-4'}`}
              style={{
                border: `1px solid ${activeZoom === z.label ? 'var(--blue)' : 'var(--bd)'}`,
                background: activeZoom === z.label ? 'var(--blue-dim)' : 'transparent',
                color: activeZoom === z.label ? 'var(--blue-l)' : 'var(--t4)',
              }}
            >{z.label}</Button>
          ))}
        </div>
        {isActive && (
          <div className="flex min-w-0 items-center gap-2">
            <span className="mono min-w-0 truncate text-[length:var(--text-caption)] text-[var(--t2)]">{fmt(rng[0])} — {fmt(rng[1])}</span>
            <Button variant="ghost" size="xs" onClick={() => onTimeRange(null)}
              className="mono rounded-sm px-1 py-0 h-4 text-[length:var(--text-tiny)]"
              style={{ color: 'var(--danger)', background: 'var(--danger-dim)', border: '1px solid var(--danger)' }}
            >×</Button>
          </div>
        )}
      </div>
      <TimelineTrack
        histogram={histogram} ticks={ticks}
        leftPct={toPct(rng[0])} rightPct={toPct(rng[1])}
        isActive={isActive} isMobile={isMobile} trackRef={trackRef}
        onClick={handleClick} onTouchStart={handleTouchStart} onHandleDown={handleMouseDown}
      />
    </div>
  );
}
