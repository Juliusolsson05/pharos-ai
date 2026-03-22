'use client';

import { useState } from 'react';

import type { MapViewState } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';

import { MAP_STYLE_DARK, MAP_STYLE_SAT } from '@/features/map/components/map-styles';
import { MapControls }   from '@/features/map/components/MapControls';
import { MapFilterPanel } from '@/features/map/components/MapFilterPanel';
import { MapLegend }     from '@/features/map/components/MapLegend';
import { MapOverlays }   from '@/features/map/components/MapOverlays';
import { MapSidebar }    from '@/features/map/components/MapSidebar';
import { MapTimeline }   from '@/features/map/components/MapTimeline';
import { MapVisibilityMenu } from '@/features/map/components/MapVisibilityMenu';
import { MobileDetailPanel } from '@/features/map/components/mobile/MapDetailPanel';
import type { MapPageContext } from '@/features/map/components/use-map-page';

import '@/features/map/lib/deckgl-device';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {
  ctx: MapPageContext;
  embedded?: boolean;
};

export function MobileMapLayout({ ctx, embedded = false }: Props) {
  const {
    viewState, activeStory, selectedItem, showAllLabels, sidebarOpen, mapStyle, stories,
    overlayVisibility, toggleOverlay, f, tooltip, layers, handleMapClick, showTimeline,
    setViewState, activateStory, setActiveStory, setSelectedItem, setShowAllLabels,
    toggleSidebar, setSidebarOpen, setMapStyle,
  } = ctx;

  const [sheetExpanded, setSheetExpanded] = useState(false);

  return (
    <div className="w-full h-full bg-[var(--bg-app)] overflow-hidden min-w-0">
      <div className="relative overflow-hidden w-full h-full">
        {/* Map canvas */}
        <DeckGL
          viewState={{
            ...viewState,
            ...(viewState.transitionDuration ? { transitionInterpolator: new FlyToInterpolator() } : {}),
          }}
          onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
          controller layers={layers} getTooltip={tooltip} onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
        >
          <Map mapStyle={mapStyle === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_SAT} />
        </DeckGL>

        {/* ── Bottom sheet: detail + stories ── */}
        {(sidebarOpen || selectedItem) && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: sheetExpanded ? '100%' : '55%',
              transition: 'height 0.22s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 25,
              background: 'var(--bg-app)',
              borderTop: '1px solid var(--bd)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Detail panel (inline, above stories) */}
            {selectedItem && (
              <MobileDetailPanel
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onSelectItem={setSelectedItem}
                onActivateStory={activateStory}
              />
            )}

            {/* Stories list */}
            {sidebarOpen && (
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <MapSidebar
                  isOpen={sidebarOpen}
                  stories={stories}
                  activeStory={activeStory}
                  onToggle={() => { setSheetExpanded(false); toggleSidebar(); }}
                  onActivateStory={story => {
                    setSidebarOpen(true);
                    setSelectedItem(null);
                    activateStory(story);
                  }}
                  onClearStory={() => setActiveStory(null)}
                  expanded={sheetExpanded}
                  onToggleExpand={() => setSheetExpanded(prev => !prev)}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Map overlays ── */}
        <MapOverlays
          activeStory={activeStory}
          onClearStory={() => setActiveStory(null)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          embedded={embedded}
          isMobile
        />

        {overlayVisibility.legend && (
          <MapLegend hasPanel={false} timelineVisible={showTimeline} isMobile />
        )}

        <MapControls
          showAllLabels={showAllLabels}
          viewState={viewState}
          mapStyle={mapStyle}
          hasPanel={false}
          timelineVisible={showTimeline}
          isMobile
          onShowAllLabelsChange={setShowAllLabels}
          onStyleChange={setMapStyle}
        />

        {/* Visibility menu */}
        <div style={{
          position: 'absolute',
          bottom: showTimeline ? 'calc(126px + var(--safe-bottom))' : 'calc(82px + var(--safe-bottom))',
          right: 'max(12px, var(--safe-right))',
          zIndex: 10,
        }}>
          <MapVisibilityMenu visibility={overlayVisibility} onToggle={toggleOverlay} />
        </div>

        {/* Filter panel */}
        {overlayVisibility.filters && (
          <div style={{ position: 'absolute', top: 56, right: 'max(12px, var(--safe-right))', zIndex: 10 }}>
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

        {/* Timeline */}
        {showTimeline && (
          <MapTimeline
            rawData={f.rawData}
            dataExtent={f.dataExtent}
            viewExtent={f.viewExtent}
            onViewExtent={f.setViewExtent}
            timeRange={f.state.timeRange}
            onTimeRange={f.setTimeRange}
            isMobile
          />
        )}
      </div>
    </div>
  );
}
