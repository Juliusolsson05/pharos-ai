'use client';

import { useMemo } from 'react';

import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { Layer, MapViewState } from '@deck.gl/core';
import { ArcLayer, PolygonLayer,ScatterplotLayer, TextLayer } from '@deck.gl/layers';

import type { SelectedItem } from '@/features/map/components/types';
import { selectVisibleLabels } from '@/features/map/lib/label-visibility';

import type { Asset, HeatPoint,MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { ActorMeta } from '@/data/map-tokens';
import { NAVAL_RGB, STATUS_META } from '@/data/map-tokens';
import type { MapStory } from '@/types/domain';

import type { FilteredData } from './use-map-filters';

// Types

const FALLBACK_META: ActorMeta = {
  label: '??', cssVar: 'var(--t3)', rgb: [143, 153, 168],
  affiliation: 'NEUTRAL', group: 'Unknown',
};

type Props = {
  filtered:    FilteredData;
  actorMeta:   Record<string, ActorMeta>;
  activeStory: MapStory | null;
  selectedItem: SelectedItem | null;
  viewState: MapViewState;
  isSatellite: boolean;
  isMobile?:   boolean;
};

type RGBA = [number, number, number, number];

// Helpers

const activeAlpha = (isSatellite: boolean) => (isSatellite ? 255 : 220);

const withAlpha = (rgb: number[], a: number): RGBA => [rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, a];

/** Alpha for non-highlighted items */
const DIM = 40;

/** Actor-driven color, dimmed when not in active story's highlight set. */
function actorColor(
  rgb: number[],
  id: string,
  highlightIds: string[],
  isDimActive: boolean,
  alpha: number,
): RGBA {
  if (isDimActive && !highlightIds.includes(id)) return withAlpha(rgb, DIM);
  return withAlpha(rgb, alpha);
}

function statusFill(status: Target['status'] | Asset['status']): [number, number, number] {
  switch (status) {
    case 'DESTROYED': return [220, 50,  50 ];
    case 'DAMAGED':   return [220, 150, 50 ];
    case 'STRUCK':    return [220, 180, 80 ];
    case 'DEGRADED':  return [180, 160, 60 ];
    default:          return [80,  180, 120];   // ACTIVE → green
  }
}

// Hook

 
export function useMapLayers({
  filtered,
  actorMeta,
  activeStory,
  selectedItem,
  viewState,
  isSatellite,
  isMobile = false,
}: Props): Layer[] {
  return useMemo(() => {
    const alpha    = activeAlpha(isSatellite);
    const dimActive = activeStory !== null;

    const highlighted = (id: string, arr: string[]) => !dimActive || arr.includes(id);

    // Label appearance boosts in satellite mode
    const labelSize    = isSatellite ? 12 : 11;
    const labelWeight  = isSatellite ? 700 : 400;
    const labelBg: RGBA = isSatellite ? [10, 14, 22, 230] : [28, 33, 39, 200];
    const strokeWidth  = isSatellite ? 2 : 1;
    const visibleLabels = selectVisibleLabels(
      filtered.targets,
      filtered.assets,
      viewState,
      selectedItem,
      activeStory,
    );

    // Heat map
    const heatLayer = filtered.heat.length > 0 && new HeatmapLayer<HeatPoint>({
      id: 'heat',
      data: filtered.heat,
      getPosition: (d: HeatPoint): [number, number] => d.position,
      getWeight:   (d: HeatPoint): number => d.weight,
      radiusPixels: 60,
      intensity: dimActive ? 0.3 : 1,
      threshold: 0.03,
      colorRange: [
        [255, 255, 178, 25], [254, 204, 92, 80],
        [253, 141, 60, 120], [240, 59, 32, 160], [189, 0, 38, 200],
      ],
    });

    // Threat zones
    const zoneLayer = filtered.zones.length > 0 && new PolygonLayer<ThreatZone>({
      id: 'zones',
      data: filtered.zones,
      getPolygon:    (d: ThreatZone): [number, number][] => d.coordinates,
      getFillColor:  (d: ThreatZone): RGBA => dimActive ? [d.color[0], d.color[1], d.color[2], 20] : d.color,
      getLineColor:  (d: ThreatZone): RGBA => dimActive
        ? [d.color[0], d.color[1], d.color[2], 40]
        : [d.color[0], d.color[1], d.color[2], 200],
      lineWidthMinPixels: 1,
      filled: true,
      stroked: true,
      pickable: true,
      autoHighlight: true,
      updateTriggers: { getFillColor: [dimActive], getLineColor: [dimActive] },
    });

    // Strike arcs
    const strikeLayer = filtered.strikes.length > 0 && new ArcLayer<StrikeArc>({
      id: 'strikes',
      data: filtered.strikes,
      getSourcePosition: (d: StrikeArc): [number, number] => d.from,
      getTargetPosition: (d: StrikeArc): [number, number] => d.to,
      getSourceColor: (d: StrikeArc): RGBA => {
        const rgb = d.type === 'NAVAL_STRIKE' ? NAVAL_RGB : (actorMeta[d.actor] ?? FALLBACK_META).rgb;
        return highlighted(d.id, activeStory?.highlightStrikeIds ?? [])
          ? withAlpha(rgb, alpha)
          : withAlpha(rgb, DIM);
      },
      getTargetColor: (d: StrikeArc): RGBA =>
        highlighted(d.id, activeStory?.highlightStrikeIds ?? [])
          ? [255, 255, 255, isSatellite ? 230 : 180]
          : [255, 255, 255, 30],
      getWidth: (d: StrikeArc): number =>
        (isSatellite ? 1 : 0) + (d.severity === 'CRITICAL' ? 3 : 2),
      widthUnits: 'pixels',
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getSourceColor: [activeStory?.id, isSatellite],
        getTargetColor: [activeStory?.id, isSatellite],
        getWidth:       [isSatellite],
      },
    });

    // Missile arcs
    const missileLayer = filtered.missiles.length > 0 && new ArcLayer<MissileTrack>({
      id: 'missiles',
      data: filtered.missiles,
      getSourcePosition: (d: MissileTrack): [number, number] => d.from,
      getTargetPosition: (d: MissileTrack): [number, number] => d.to,
      getSourceColor: (d: MissileTrack): RGBA =>
        actorColor((actorMeta[d.actor] ?? FALLBACK_META).rgb, d.id, activeStory?.highlightMissileIds ?? [], dimActive, alpha),
      getTargetColor: (d: MissileTrack): RGBA => {
        if (dimActive && !(activeStory?.highlightMissileIds ?? []).includes(d.id)) return withAlpha((actorMeta[d.actor] ?? FALLBACK_META).rgb, DIM);
        return d.status === 'INTERCEPTED' ? [255, 200, 0, alpha] : [255, 50, 50, alpha];
      },
      getWidth: (d: MissileTrack): number =>
        (isSatellite ? 1 : 0) + (d.severity === 'CRITICAL' ? 3 : 2),
      widthUnits: 'pixels',
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getSourceColor: [activeStory?.id, isSatellite],
        getTargetColor: [activeStory?.id, isSatellite],
        getWidth:       [isSatellite],
      },
    });

    // Target scatter
    const targetLayer = filtered.targets.length > 0 && new ScatterplotLayer<Target>({
      id: 'targets',
      data: filtered.targets,
      getPosition:  (d: Target): [number, number] => d.position,
      getRadius:    (d: Target): number =>
        d.status === 'DESTROYED' ? 18000 : d.status === 'DAMAGED' ? 14000 : 10000,
      getFillColor: (d: Target): RGBA => {
        const base = statusFill(d.status);
        if (dimActive && !(activeStory?.highlightTargetIds ?? []).includes(d.id)) return withAlpha(base, DIM);
        return withAlpha(base, alpha);
      },
      stroked: true,
      getLineColor: (): RGBA => [255, 255, 255, isSatellite ? 220 : 100],
      lineWidthMinPixels: strokeWidth,
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getFillColor: [activeStory?.id, isSatellite],
        getLineColor: [isSatellite],
      },
    });

    // Asset scatter
    const assetLayer = filtered.assets.length > 0 && new ScatterplotLayer<Asset>({
      id: 'assets',
      data: filtered.assets,
      getPosition:  (d: Asset): [number, number] => d.position,
      getRadius:    (d: Asset): number => (d.type === 'CARRIER' ? 20000 : 14000),
      getFillColor: (d: Asset): RGBA =>
        actorColor((actorMeta[d.actor] ?? FALLBACK_META).rgb, d.id, activeStory?.highlightAssetIds ?? [], dimActive, alpha),
      stroked: true,
      getLineColor: (): RGBA => [255, 255, 255, isSatellite ? 220 : 150],
      lineWidthMinPixels: strokeWidth,
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getFillColor: [activeStory?.id, isSatellite],
        getLineColor: [isSatellite],
      },
    });

    // Target labels
    const targetLabels = !isMobile && visibleLabels.targets.length > 0 && new TextLayer<Target>({
      id: 'target-labels',
      data: visibleLabels.targets,
      getPosition:       (d: Target): [number, number] => d.position,
      getText:           (d: Target): string => d.name,
      getSize:           labelSize,
      getColor:          (): RGBA => isSatellite ? [255, 255, 255, 240] : [220, 220, 220, 200],
      getPixelOffset:    (): [number, number] => [0, -20],
      fontFamily:        'SFMono-Regular, Menlo, monospace',
      fontWeight:        labelWeight,
      background:        true,
      getBackgroundColor: (): RGBA => labelBg,
      backgroundPadding: [4, 3, 4, 3] as [number, number, number, number],
      pickable:          true,
      autoHighlight:     true,
      updateTriggers:    { getColor: [isSatellite], getBackgroundColor: [isSatellite] },
    });

    // Asset labels
    const assetLabels = !isMobile && visibleLabels.assets.length > 0 && new TextLayer<Asset>({
      id: 'asset-labels',
      data: visibleLabels.assets,
      getPosition:       (d: Asset): [number, number] => d.position,
      getText:           (d: Asset): string => d.name,
      getSize:           isSatellite ? 11 : 10,
      getColor:          (d: Asset): RGBA => {
        const [r, g, b] = (actorMeta[d.actor] ?? FALLBACK_META).rgb;
        return isSatellite ? [r + 40, g + 40, b + 40, 255] : [r, g, b, 200];
      },
      getPixelOffset:    (): [number, number] => [0, -22],
      fontFamily:        'SFMono-Regular, Menlo, monospace',
      fontWeight:        labelWeight,
      background:        true,
      getBackgroundColor: (): RGBA => labelBg,
      backgroundPadding: [4, 3, 4, 3] as [number, number, number, number],
      pickable:          true,
      autoHighlight:     true,
      updateTriggers:    { getColor: [isSatellite], getBackgroundColor: [isSatellite] },
    });

    const layers = [heatLayer, zoneLayer, strikeLayer, missileLayer, targetLayer, assetLayer, targetLabels, assetLabels].filter(Boolean);

    return layers as Layer[];
  }, [filtered, actorMeta, activeStory, selectedItem, viewState, isSatellite, isMobile]);
}

// Re-export so tooltip handler can share STATUS_META without another import
export { STATUS_META };
