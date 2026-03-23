'use client';

import { useMemo } from 'react';

import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ArcLayer, PolygonLayer,ScatterplotLayer, TextLayer } from '@deck.gl/layers';

import type { MapDataResult } from '@/features/map/queries';

import type {
  Asset,
  HeatPoint,
  MissileTrack,
  StrikeArc,
  Target,
  ThreatZone,
} from '@/data/map-data';

export type LayerVisibility = {
  strikes: boolean;
  missiles: boolean;
  targets: boolean;
  assets: boolean;
  zones: boolean;
  heat: boolean;
};

export type TooltipObject = StrikeArc | MissileTrack | Target | Asset | ThreatZone | HeatPoint;

function textToken(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function useMapLayers(visibility: LayerVisibility, mapData: MapDataResult | undefined) {
  return useMemo(() => {
    const strikes = mapData?.strikes ?? [];
    const missiles = mapData?.missiles ?? [];
    const targets = mapData?.targets ?? [];
    const assets = mapData?.assets ?? [];
    const zones = mapData?.zones ?? [];
    const heatPts = mapData?.heat ?? [];

    return [
    visibility.heat && heatPts.length > 0 &&
      new HeatmapLayer<HeatPoint>({
        id: 'heat',
        data: heatPts,
        getPosition: (d: HeatPoint): [number, number] => d.position,
        getWeight: (d: HeatPoint): number => d.weight,
        radiusPixels: 60,
        intensity: 1,
        threshold: 0.03,
        colorRange: [
          [255, 255, 178, 25],
          [254, 204, 92, 80],
          [253, 141, 60, 120],
          [240, 59, 32, 160],
          [189, 0, 38, 200],
        ],
      }),

    visibility.zones && zones.length > 0 &&
      new PolygonLayer<ThreatZone>({
        id: 'zones',
        data: zones,
        getPolygon: (d: ThreatZone): [number, number][] => d.coordinates,
        getFillColor: (d: ThreatZone): [number, number, number, number] => d.color,
        getLineColor: (d: ThreatZone): [number, number, number, number] => [d.color[0], d.color[1], d.color[2], 200],
        lineWidthMinPixels: 1,
        filled: true,
        stroked: true,
        pickable: true,
        autoHighlight: true,
      }),

    visibility.strikes && strikes.length > 0 &&
      new ArcLayer<StrikeArc>({
        id: 'strikes',
        data: strikes,
        getSourcePosition: (d: StrikeArc): [number, number] => d.from,
        getTargetPosition: (d: StrikeArc): [number, number] => d.to,
        getSourceColor: (d: StrikeArc): [number, number, number, number] =>
          d.type === 'NAVAL_STRIKE'
            ? [50, 200, 200, 220]
            : d.actor === 'ISRAEL'
            ? [50, 200, 120, 220]
            : [45, 114, 210, 220],
        getTargetColor: (): [number, number, number, number] => [255, 255, 255, 180],
        getWidth: (d: StrikeArc): number => (d.severity === 'CRITICAL' ? 3 : 2),
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getSourceColor: [],
          getTargetColor: [],
        },
      }),

    visibility.missiles && missiles.length > 0 &&
      new ArcLayer<MissileTrack>({
        id: 'missiles',
        data: missiles,
        getSourcePosition: (d: MissileTrack): [number, number] => d.from,
        getTargetPosition: (d: MissileTrack): [number, number] => d.to,
        getSourceColor: (): [number, number, number, number] => [210, 50, 50, 220],
        getTargetColor: (d: MissileTrack): [number, number, number, number] =>
          d.status === 'INTERCEPTED' ? [255, 200, 0, 200] : [255, 50, 50, 220],
        getWidth: (d: MissileTrack): number => (d.severity === 'CRITICAL' ? 3 : 2),
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getSourceColor: [],
          getTargetColor: [],
        },
      }),

    visibility.targets && targets.length > 0 &&
      new ScatterplotLayer<Target>({
        id: 'targets',
        data: targets,
        getPosition: (d: Target): [number, number] => d.position,
        getRadius: (d: Target): number =>
          d.status === 'DESTROYED' ? 18000 : d.status === 'DAMAGED' ? 14000 : 10000,
        getFillColor: (d: Target): [number, number, number, number] =>
          d.status === 'DESTROYED'
            ? [220, 50, 50, 200]
            : d.status === 'DAMAGED'
            ? [220, 150, 50, 200]
            : [220, 200, 50, 200],
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: [],
          getLineColor: [],
        },
      }),

    visibility.assets && assets.length > 0 &&
      new ScatterplotLayer<Asset>({
        id: 'assets',
        data: assets,
        getPosition: (d: Asset): [number, number] => d.position,
        getRadius: (d: Asset): number => (d.type === 'CARRIER' ? 20000 : 14000),
        getFillColor: (d: Asset): [number, number, number, number] =>
          d.actor === 'US' ? [45, 114, 210, 220] : [50, 200, 200, 220],
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 150],
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: [],
          getLineColor: [],
        },
      }),

    visibility.targets && targets.length > 0 &&
      new TextLayer<Target>({
        id: 'target-labels',
        data: targets,
        getPosition: (d: Target): [number, number] => d.position,
        getText: (d: Target): string => d.name,
        getSize: textToken('--text-body-sm', 11),
        getColor: (): [number, number, number, number] => [220, 220, 220, 200],
        getPixelOffset: (): [number, number] => [0, -20],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        background: true,
        getBackgroundColor: (): [number, number, number, number] => [28, 33, 39, 200],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      }),

    visibility.assets && assets.length > 0 &&
      new TextLayer<Asset>({
        id: 'asset-labels',
        data: assets,
        getPosition: (d: Asset): [number, number] => d.position,
        getText: (d: Asset): string => d.name,
        getSize: textToken('--text-label', 10),
        getColor: (): [number, number, number, number] => [150, 200, 255, 200],
        getPixelOffset: (): [number, number] => [0, -22],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        background: true,
        getBackgroundColor: (): [number, number, number, number] => [28, 33, 39, 200],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      }),

    ].filter(Boolean);
  }, [visibility, mapData]);
}
