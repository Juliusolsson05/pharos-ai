'use client';

import type { MapViewState } from '@deck.gl/core';

import { Button } from '@/components/ui/button';

type Props = {
  showAllLabels:    boolean;
  viewState:        MapViewState;
  mapStyle:         'dark' | 'satellite';
  hasPanel:         boolean;
  timelineVisible?: boolean;
  isMobile?:        boolean;
  onShowAllLabelsChange: (show: boolean) => void;
  onStyleChange:    (s: 'dark' | 'satellite') => void;
};

export function MapControls({
  viewState,
  mapStyle,
  hasPanel,
  timelineVisible = true,
  isMobile = false,
  onShowAllLabelsChange,
  onStyleChange,
  showAllLabels,
}: Props) {
  const right: number | string = isMobile ? 'max(12px, var(--safe-right))' : (hasPanel ? 332 : 12);
  const bottomOffset = timelineVisible ? 0 : -44;
  const coordBottom = isMobile ? 64 + bottomOffset : 56 + bottomOffset;
  const switcherBottom = isMobile ? 126 + bottomOffset : 118 + bottomOffset;
  const coordBottomStyle = isMobile ? `calc(${coordBottom}px + var(--safe-bottom))` : coordBottom;
  const switcherBottomStyle = isMobile ? `calc(${switcherBottom}px + var(--safe-bottom))` : switcherBottom;

  return (
    <>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onShowAllLabelsChange(!showAllLabels)}
        className={`mono absolute z-10 h-auto rounded-sm px-2.5 py-1 font-bold ${isMobile ? 'text-[length:var(--text-caption)]' : 'text-[length:var(--text-tiny)]'}`}
        style={{
          background: showAllLabels ? 'var(--blue-dim)' : 'rgba(28,33,39,0.92)',
          border: '1px solid var(--bd)',
          bottom: isMobile ? `calc(${switcherBottom + 32}px + var(--safe-bottom))` : switcherBottom + 30,
          color: showAllLabels ? 'var(--blue-l)' : 'var(--t3)',
          right,
          transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1), bottom 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        LABELS {showAllLabels ? 'ALL' : 'SMART'}
      </Button>

      {/* Map style switcher */}
      <div className="absolute flex overflow-hidden rounded-sm z-10"
        style={{ bottom: switcherBottomStyle, right, border: '1px solid var(--bd)', transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1), bottom 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
        {(['dark', 'satellite'] as const).map((mode, i) => (
          <Button key={mode} variant="ghost" size="xs" onClick={() => onStyleChange(mode)}
            className={`mono rounded-none px-2.5 py-1 h-auto font-bold ${isMobile ? 'text-[length:var(--text-caption)]' : 'text-[length:var(--text-tiny)]'}`}
            style={{
              background:  mapStyle === mode ? 'var(--blue)' : 'rgba(28,33,39,0.92)',
              borderRight: i === 0 ? '1px solid var(--bd)' : 'none',
              color:       mapStyle === mode ? 'var(--t1)' : 'var(--t3)',
            }}
          >{mode === 'dark' ? 'DARK' : 'SAT'}</Button>
        ))}
      </div>

      {/* Coordinates */}
      <div className="mono absolute pointer-events-none"
        style={{
          bottom: coordBottomStyle, right,
          background: 'rgba(28,33,39,0.85)', border: '1px solid var(--bd)',
          padding: '4px 8px', fontSize: 'var(--text-caption)', color: 'var(--t4)',
          transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1), bottom 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {viewState.latitude.toFixed(2)}°N {viewState.longitude.toFixed(2)}°E
      </div>
    </>
  );
}
