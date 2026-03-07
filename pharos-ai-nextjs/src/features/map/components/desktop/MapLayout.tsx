'use client';

import '@/features/map/lib/deckgl-device';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_STYLE_DARK, MAP_STYLE_SAT } from '@/features/map/components/map-styles';

import MapSidebar        from '@/features/map/components/MapSidebar';
import MapControls       from '@/features/map/components/MapControls';
import MapOverlays       from '@/features/map/components/MapOverlays';
import { DesktopDetailPanel } from '@/features/map/components/desktop/MapDetailPanel';
import MapLegend         from '@/features/map/components/MapLegend';
import MapFilterPanel    from '@/features/map/components/MapFilterPanel';
import MapTimeline       from '@/features/map/components/MapTimeline';
import MapVisibilityMenu from '@/features/map/components/MapVisibilityMenu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { usePanelLayout } from '@/shared/hooks/use-panel-layout';

import type { MapPageContext } from '@/features/map/components/use-map-page';
import { FlyToInterpolator } from '@deck.gl/core';
import type { MapViewState } from '@deck.gl/core';

type Props = {
  ctx: MapPageContext;
  embedded?: boolean;
};

export default function DesktopMapLayout({ ctx, embedded = false }: Props) {
  const {
    viewState, activeStory, selectedItem, sidebarOpen, mapStyle, stories,
    overlayVisibility, toggleOverlay, f, tooltip, layers, handleMapClick, showTimeline,
    setViewState, activateStory, setActiveStory, setSelectedItem,
    toggleSidebar, setMapStyle,
  } = ctx;

  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'map', panelIds: ['sidebar', 'canvas'] });

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      className="w-full h-full bg-[var(--bg-app)] overflow-hidden min-w-0"
    >
      {/* ── Sidebar (stories) ── */}
      {sidebarOpen && (
        <>
          <ResizablePanel id="sidebar" defaultSize="25%" minSize="15%" maxSize="40%" className="flex flex-col overflow-hidden min-w-[280px]">
            <MapSidebar
              isOpen={sidebarOpen}
              stories={stories}
              activeStory={activeStory}
              onToggle={toggleSidebar}
              onActivateStory={story => {
                setSelectedItem(null);
                activateStory(story);
              }}
              onClearStory={() => setActiveStory(null)}
            />
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}

      {/* ── Map canvas ── */}
      <ResizablePanel id="canvas" defaultSize="75%" minSize="40%" className="relative overflow-hidden">
        <div className="relative overflow-hidden w-full h-full">
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

          {/* Overlays */}
          <MapOverlays
            activeStory={activeStory}
            onClearStory={() => setActiveStory(null)}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={toggleSidebar}
            embedded={embedded}
            isMobile={false}
          />

          {overlayVisibility.legend && (
            <MapLegend hasPanel={!!selectedItem} timelineVisible={showTimeline} />
          )}

          <MapControls
            viewState={viewState}
            mapStyle={mapStyle}
            hasPanel={!!selectedItem}
            timelineVisible={showTimeline}
            isMobile={false}
            onStyleChange={setMapStyle}
          />

          {/* Visibility menu */}
          <div style={{
            position: 'absolute',
            bottom: showTimeline ? 118 : 74,
            right: selectedItem ? 332 : 12,
            zIndex: 10,
            transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <MapVisibilityMenu visibility={overlayVisibility} onToggle={toggleOverlay} />
          </div>

          {/* Filter panel */}
          {overlayVisibility.filters && (
            <div style={{
              position: 'absolute',
              top: 12,
              right: selectedItem ? 332 : 12,
              zIndex: 10,
              transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}>
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

          {/* Detail panel (absolute right side) */}
          <DesktopDetailPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onSelectItem={setSelectedItem}
            onActivateStory={activateStory}
          />

          {/* Timeline */}
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
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
