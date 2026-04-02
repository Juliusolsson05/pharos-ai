'use client';

import { useCallback, useMemo } from 'react';

import type { Layer as DeckLayer, MapViewState, PickingInfo } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { Layer, Map, Source } from 'react-map-gl/maplibre';

import '@/features/map/lib/deckgl-device';

import { OSINT_BASE_URL } from '@/lib/api';
import type { NightlightsManifest } from '@/features/map/types';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

type Props = {
  viewState: MapViewState;
  layers: DeckLayer[];
  manifest: NightlightsManifest | null;
  showNightlights: boolean;
  onViewStateChange: (vs: MapViewState) => void;
  onClick: (info: PickingInfo) => void;
  getTooltip: (info: { layer?: { id: string } | null; object?: unknown }) => { text: string } | null;
};

export function MapCanvas({
  viewState,
  layers,
  manifest,
  showNightlights,
  onViewStateChange,
  onClick,
  getTooltip,
}: Props) {
  const snapshotUrl = showNightlights && manifest?.snapshot
    ? `${OSINT_BASE_URL}${manifest.snapshot.tileUrl}`
    : null;
  const dailyUrl = showNightlights && manifest?.daily
    ? `${OSINT_BASE_URL}${manifest.daily.tileUrl}`
    : null;

  const handleViewStateChange = useCallback(
    ({ viewState: next }: { viewState: unknown }) => onViewStateChange(next as MapViewState),
    [onViewStateChange],
  );

  const deckStyle = useMemo(() => ({ position: 'absolute' as const, inset: '0px', padding: '0px' }), []);
  const deckViewState = useMemo(() => ({ ...viewState }), [viewState]);

  return (
    <DeckGL
      controller
      layers={layers}
      viewState={deckViewState}
      getTooltip={getTooltip as never}
      onClick={onClick}
      onViewStateChange={handleViewStateChange}
      style={deckStyle}
    >
      <Map mapStyle={MAP_STYLE} reuseMaps>
        {snapshotUrl ? (
          <Source
            id="nightlights-snapshot"
            type="raster"
            tiles={[snapshotUrl]}
            tileSize={manifest!.tileSize}
            minzoom={manifest!.minzoom}
            maxzoom={manifest!.maxzoom}
            bounds={manifest!.snapshot!.bounds ?? undefined}
          >
            <Layer id="nl-snapshot" type="raster" beforeId="boundary_county" paint={{ 'raster-opacity': 0.5 }} />
          </Source>
        ) : null}
        {dailyUrl ? (
          <Source
            id="nightlights-daily"
            type="raster"
            tiles={[dailyUrl]}
            tileSize={manifest!.tileSize}
            minzoom={manifest!.minzoom}
            maxzoom={manifest!.maxzoom}
            bounds={manifest!.daily.bounds ?? undefined}
          >
            <Layer id="nl-daily" type="raster" beforeId="boundary_county" paint={{ 'raster-opacity': 0.5 }} />
          </Source>
        ) : null}
      </Map>
    </DeckGL>
  );
}
