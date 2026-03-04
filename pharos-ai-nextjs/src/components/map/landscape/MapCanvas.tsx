'use client';

import { useState } from 'react';
import { ArrowLeft, Layers, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';

import '@/lib/deckgl-device';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { FlyToInterpolator } from '@deck.gl/core';
import { MAP_STYLE_DARK, MAP_STYLE_SAT } from '@/components/map/map-styles';
import MapTimeline       from '@/components/map/MapTimeline';
import MapVisibilityMenu from '@/components/map/MapVisibilityMenu';

import type { MapPageContext } from '@/components/map/use-map-page';
import type { MapViewState } from '@deck.gl/core';
import type { OverlayVisibility } from '@/components/map/MapVisibilityMenu';

type Props = {
  ctx: MapPageContext;
  onOpenStories: () => void;
  onSelectFeature: () => void;
};

export function MapCanvas({ ctx, onOpenStories, onSelectFeature }: Props) {
  const {
    viewState, mapStyle, layers, tooltip, handleMapClick, showTimeline,
    overlayVisibility, toggleOverlay, f,
    setViewState, setMapStyle, selectedItem,
  } = ctx;

  const [timelineVisible, setTimelineVisible] = useState(false);

  const handleClick = (...args: Parameters<typeof handleMapClick>) => {
    handleMapClick(...args);
    // If a feature was selected, notify parent to push detail screen
    // We check after a tick since handleMapClick dispatches to Redux
    setTimeout(() => onSelectFeature(), 0);
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      <DeckGL
        viewState={{
          ...viewState,
          ...(viewState.transitionDuration ? { transitionInterpolator: new FlyToInterpolator() } : {}),
        }}
        onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
        controller
        layers={layers}
        getTooltip={tooltip}
        onClick={handleClick}
        style={{ width: '100%', height: '100%' }}
      >
        <Map mapStyle={mapStyle === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_SAT} />
      </DeckGL>

      {/* ── Floating controls: top-left ── */}
      <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10" style={{ left: 'max(8px, var(--safe-left))' }}>
        {/* Back to dashboard */}
        <Link href="/dashboard" className="no-underline">
          <button className="flex items-center justify-center w-8 h-8 bg-[rgba(28,33,39,0.85)] border border-[var(--bd)] text-[var(--t3)] hover:text-[var(--t1)] transition-colors">
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
        </Link>

        {/* Stories */}
        <button
          onClick={onOpenStories}
          className="flex items-center justify-center w-8 h-8 bg-[rgba(28,33,39,0.85)] border border-[var(--bd)] text-[var(--blue-l)] hover:text-[var(--t1)] transition-colors"
          title="Stories"
        >
          <BookOpen size={14} strokeWidth={2} />
        </button>
      </div>

      {/* ── Floating controls: top-right ── */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10" style={{ right: 'max(8px, var(--safe-right))' }}>
        {/* Map style toggle */}
        <button
          onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
          className="flex items-center justify-center w-8 h-8 bg-[rgba(28,33,39,0.85)] border border-[var(--bd)] text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
          title="Toggle map style"
        >
          <Layers size={14} strokeWidth={2} />
        </button>

        {/* Visibility menu */}
        <MapVisibilityMenu visibility={overlayVisibility} onToggle={toggleOverlay} />
      </div>

      {/* ── Timeline toggle: bottom-right ── */}
      <div className="absolute bottom-2 right-2 z-10" style={{ right: 'max(8px, var(--safe-right))', bottom: 'max(8px, var(--safe-bottom))' }}>
        <button
          onClick={() => setTimelineVisible(p => !p)}
          className={`flex items-center justify-center w-8 h-8 border transition-colors ${
            timelineVisible
              ? 'bg-[var(--blue-dim)] border-[var(--blue)] text-[var(--blue-l)]'
              : 'bg-[rgba(28,33,39,0.85)] border-[var(--bd)] text-[var(--t3)] hover:text-[var(--t1)]'
          }`}
          title="Toggle timeline"
        >
          <Clock size={14} strokeWidth={2} />
        </button>
      </div>

      {/* ── Timeline (expandable) ── */}
      {timelineVisible && showTimeline && (
        <div className="absolute bottom-10 left-2 right-12 z-10" style={{ left: 'max(8px, var(--safe-left))', bottom: 'max(42px, calc(8px + var(--safe-bottom) + 34px))' }}>
          <MapTimeline
            rawData={f.rawData}
            dataExtent={f.dataExtent}
            viewExtent={f.viewExtent}
            onViewExtent={f.setViewExtent}
            timeRange={f.state.timeRange}
            onTimeRange={f.setTimeRange}
            isMobile
          />
        </div>
      )}
    </div>
  );
}
