'use client';
import Link from 'next/link';

import type { MapViewState } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { ArrowLeft, BookOpen, Clock, Map as MapIcon } from 'lucide-react';
import Map from 'react-map-gl/maplibre';

import { Button } from '@/components/ui/button';

import { MAP_STYLE_DARK, MAP_STYLE_SAT } from '@/features/map/components/map-styles';
import { MapFilterPanel } from '@/features/map/components/MapFilterPanel';
import { MapLegend }     from '@/features/map/components/MapLegend';
import { MapTimeline }   from '@/features/map/components/MapTimeline';
import { MapVisibilityMenu } from '@/features/map/components/MapVisibilityMenu';
import type { SelectedItem } from '@/features/map/components/types';
import type { MapPageContext } from '@/features/map/components/use-map-page';

import '@/features/map/lib/deckgl-device';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {
  ctx: MapPageContext;
  onOpenStories: () => void;
  onSelectFeature: (item: SelectedItem | null) => void;
};

export function MapCanvas({ ctx, onOpenStories, onSelectFeature }: Props) {
  const {
    viewState, mapStyle, layers, tooltip, handleMapClick, showAllLabels, showTimeline,
    overlayVisibility, toggleOverlay, f,
    setShowAllLabels, setViewState, setMapStyle,
  } = ctx;

  const handleClick = (...args: Parameters<typeof handleMapClick>) => {
    const item = handleMapClick(...args);
    onSelectFeature(item);
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
      <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20" style={{ left: 'max(8px, env(safe-area-inset-left))' }}>
        {/* Back to dashboard */}
        <Button asChild variant="ghost" size="icon-sm" className="h-8 w-8 bg-[rgba(28,33,39,0.85)] border border-[var(--bd)] text-[var(--t3)] hover:text-[var(--t1)] rounded-none">
          <Link href="/dashboard" className="no-underline">
            <ArrowLeft size={14} strokeWidth={2} />
          </Link>
        </Button>

        {/* Stories */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenStories}
          className="h-8 w-8 bg-[rgba(28,33,39,0.85)] border border-[var(--bd)] text-[var(--blue-l)] hover:text-[var(--t1)] transition-colors rounded-none"
          title="Stories"
        >
          <BookOpen size={14} strokeWidth={2} />
        </Button>
      </div>

      {/* ── Floating controls: top-right ── */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20" style={{ right: 'max(8px, env(safe-area-inset-right))' }}>
        {/* Map style toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
          className="h-8 w-8 bg-[rgba(28,33,39,0.85)] border border-[var(--bd)] text-[var(--t3)] hover:text-[var(--t1)] transition-colors rounded-none"
          title="Toggle map style"
        >
          <MapIcon size={14} strokeWidth={2} />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowAllLabels(!showAllLabels)}
          className={`h-8 w-8 border transition-colors rounded-none ${
            showAllLabels
              ? 'bg-[var(--blue-dim)] border-[var(--blue)] text-[var(--blue-l)]'
              : 'bg-[rgba(28,33,39,0.85)] border-[var(--bd)] text-[var(--t3)] hover:text-[var(--t1)]'
          }`}
          title={showAllLabels ? 'Use smart label filtering' : 'Show all labels'}
        >
          <span className="mono text-[length:var(--text-tiny)] font-bold">LBL</span>
        </Button>

        {/* Visibility menu */}
        <MapVisibilityMenu visibility={overlayVisibility} onToggle={toggleOverlay} direction="down" />
      </div>

      {overlayVisibility.legend && (
        <MapLegend hasPanel={false} timelineVisible={showTimeline} />
      )}

      {overlayVisibility.filters && (
        <div
          style={{
            position: 'absolute',
            top: 90,
            right: 'max(8px, env(safe-area-inset-right))',
            zIndex: 19,
            maxHeight: 'calc(100% - 140px)',
            overflow: 'auto',
          }}
        >
          <MapFilterPanel
            defaultExpanded
            state={f.state}
            facets={f.facets}
            isFiltered={f.isFiltered}
            onToggleDataset={f.toggleDataset}
            onToggleType={f.toggleType}
            onToggleActor={f.toggleActor}
            onTogglePriority={f.togglePriority}
            onToggleStatus={f.toggleStatus}
            onToggleHeat={f.toggleHeat}
            onReset={f.resetFilters}
          />
        </div>
      )}

      {/* ── Timeline toggle: bottom-right ── */}
      <div
        className="absolute bottom-2 right-2 z-20"
        style={{
          right: 'max(8px, env(safe-area-inset-right))',
          bottom: showTimeline
            ? 'max(46px, calc(8px + env(safe-area-inset-bottom) + 32px))'
            : 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleOverlay('timeline')}
          className={`h-8 w-8 border transition-colors rounded-none ${
            overlayVisibility.timeline
              ? 'bg-[var(--blue-dim)] border-[var(--blue)] text-[var(--blue-l)]'
              : 'bg-[rgba(28,33,39,0.85)] border-[var(--bd)] text-[var(--t3)] hover:text-[var(--t1)]'
          }`}
          title="Toggle timeline"
        >
          <Clock size={14} strokeWidth={2} />
        </Button>
      </div>

      {/* ── Timeline (expandable) ── */}
      {showTimeline && (
        <MapTimeline
          rawData={f.rawData}
          dataExtent={f.dataExtent}
          viewExtent={f.viewExtent}
          onViewExtent={f.setViewExtent}
          timeRange={f.state.timeRange}
          onTimeRange={f.setTimeRange}
          isMobile={false}
        />
      )}
    </div>
  );
}
