'use client';

import { type MutableRefObject } from 'react';

import { Button } from '@/components/ui/button';

import { MAX_ZOOM, MIN_ZOOM, TIER_LABELS, ZOOM_STEP } from './timeline-constants';

// Types

type Props = {
  isLandscapePhone: boolean;
  selectedTiers: Set<number>;
  toggleTier: (tier: number) => void;
  zoomRef: MutableRefObject<number>;
  commitTransform: () => void;
  centerOnNewest: () => void;
  resetView: () => void;
  zoomPct: number;
  filteredCount: number;
};

// Component

export function TimelineHeader({
  isLandscapePhone,
  selectedTiers,
  toggleTier,
  zoomRef,
  commitTransform,
  centerOnNewest,
  resetView,
  zoomPct,
  filteredCount,
}: Props) {
  return (
    <div className={`${isLandscapePhone ? 'safe-px' : 'px-5'} py-2 bg-[var(--bg-2)] border-b border-[var(--bd)] flex items-center gap-3 shrink-0 z-10`}>
      <span className="mono text-[length:var(--text-body-sm)] font-bold text-white tracking-wider">TIMELINE</span>
      <div className="w-px h-4 bg-white/20" />

      <div className="flex gap-1">
        {[1, 2, 3, 4].map(tier => (
          <Button
            key={tier}
            variant="ghost"
            size="sm"
            onClick={() => toggleTier(tier)}
            className={`px-2 py-1 h-auto rounded text-[length:var(--text-caption)] mono font-bold tracking-wider
              ${selectedTiers.has(tier)
                ? 'bg-white/15 text-white border border-white/30'
                : 'text-white/40 border border-transparent hover:text-white/70'
              }`}
          >
            T{tier} {TIER_LABELS[tier]}
          </Button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 border border-white/20 rounded px-2 py-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { zoomRef.current = Math.max(MIN_ZOOM, zoomRef.current - ZOOM_STEP * 2); commitTransform(); }}
            className="mono text-xs h-auto p-0 text-white/70 hover:text-white w-4 text-center"
          >−</Button>
          <span className="mono text-[length:var(--text-caption)] text-white/70 w-10 text-center font-bold">{zoomPct}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { zoomRef.current = Math.min(MAX_ZOOM, zoomRef.current + ZOOM_STEP * 2); commitTransform(); }}
            className="mono text-xs h-auto p-0 text-white/70 hover:text-white w-4 text-center"
          >+</Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={centerOnNewest}
          className="mono text-[length:var(--text-caption)] h-auto font-bold text-white/70 hover:text-white px-2 py-1 border-white/20"
        >
          → LATEST
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetView}
          className="mono text-[length:var(--text-caption)] h-auto p-0 text-white/50 hover:text-white"
        >
          RESET
        </Button>
        <span className="mono text-[length:var(--text-caption)] font-bold text-white/60">{filteredCount} articles</span>
      </div>
    </div>
  );
}
