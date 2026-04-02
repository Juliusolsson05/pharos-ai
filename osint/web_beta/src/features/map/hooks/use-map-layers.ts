'use client';

import { useMemo } from 'react';

import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { Layer } from '@deck.gl/core';
import { IconLayer, ScatterplotLayer } from '@deck.gl/layers';

import { resolveCurrentAppSymbol, renderSymbolEntry, toDeckIcon } from '@/features/map/symbology';
import type { LayerState } from '@/features/map/state/map-slice';
import type {
  AisFeature, EonetFeature, FirmsFeature, GdeltFeature,
  OpenskyFeature, OverpassFeature, PortFeature, ReferenceFeature, UsgsFeature,
} from '@/features/map/types';

// ─── Position helpers ───────────────────────────────────────

function referencePosition(item: ReferenceFeature): [number, number] | null {
  if (item.featureKind === 'vessel') {
    return item.typicalPatrolLat != null && item.typicalPatrolLon != null
      ? [item.typicalPatrolLon, item.typicalPatrolLat] : null;
  }
  return item.lat != null && item.lon != null ? [item.lon, item.lat] : null;
}

// ─── Symbology-powered icon resolver ────────────────────────

function icon(kind: string, feature: unknown) {
  const result = resolveCurrentAppSymbol({ kind, feature } as never);
  const rendered = renderSymbolEntry(result.entry, result.identity);
  return toDeckIcon(rendered);
}

// ─── Icon sizing ────────────────────────────────────────────

function refSize(item: ReferenceFeature) {
  if (item.featureKind === 'vessel') {
    const t = item.type.toUpperCase();
    if (t === 'CARRIER') return 22;
    if (t === 'AMPHIBIOUS') return 18;
    if (t === 'DESTROYER') return 15;
    return 13;
  }
  if (item.type === 'NUCLEAR_SITE' || item.type === 'LAUNCH_ZONE') return 24;
  if (item.type === 'AIR_BASE' || item.type === 'NAVAL_BASE') return 22;
  if (item.type === 'COMMAND') return 20;
  return 18;
}

function ovSize(item: OverpassFeature) {
  return (item.military === 'airfield' || item.military === 'naval_base') ? 18 : 16;
}

function ovScore(item: OverpassFeature): number {
  let score = 0;
  const mil = item.military ?? '';
  if (mil === 'airfield') score += 30;
  else if (mil === 'naval_base') score += 30;
  else if (mil === 'base') score += 20;
  else if (mil === 'barracks') score += 10;
  else score += 5; // range, checkpoint, etc.

  if (item.name) score += 15;
  if (item.wikidata || item.wikipedia) score += 25;
  return score;
}

const OVERPASS_LIMIT = 5000;

function filterOverpass(items: OverpassFeature[]): OverpassFeature[] {
  if (items.length <= OVERPASS_LIMIT) return items;
  return items
    .map((item) => ({ item, score: ovScore(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, OVERPASS_LIMIT)
    .map(({ item }) => item);
}

function evSize(item: EonetFeature) {
  if (item.category === 'Volcanoes' || item.category === 'VO') return 18;
  if (item.category === 'Severe Storms' || item.category === 'TC') return 17;
  return 14;
}

// Smooth zoom-based scale: 1.0x at zoom 4, grows linearly to multiplier at zoom 14
function smooth(zoom: number, maxMultiplier: number) {
  const t = Math.max(0, Math.min(1, (zoom - 4) / 10));
  return 1 + t * (maxMultiplier - 1);
}

// ─── Shared layer prop builders ─────────────────────────────

function mobileProps(zoom: number) {
  return { sizeScale: smooth(zoom, 4.5), sizeUnits: 'pixels' as const, sizeMinPixels: 8, sizeMaxPixels: 80, billboard: false };
}
function siteProps(zoom: number) {
  return { sizeScale: smooth(zoom, 3.5), sizeUnits: 'pixels' as const, sizeMinPixels: 12, sizeMaxPixels: 80, billboard: false };
}
function eventProps(zoom: number) {
  return { sizeScale: smooth(zoom, 3.0), sizeUnits: 'pixels' as const, sizeMinPixels: 10, sizeMaxPixels: 70, billboard: false };
}
function portProps(zoom: number) {
  return { sizeScale: smooth(zoom, 2.5), sizeUnits: 'pixels' as const, sizeMinPixels: 14, sizeMaxPixels: 60, billboard: false };
}

// ─── Hook ───────────────────────────────────────────────────

type Data = {
  reference: ReferenceFeature[]; gdelt: GdeltFeature[]; firms: FirmsFeature[];
  usgs: UsgsFeature[]; opensky: OpenskyFeature[]; eonet: EonetFeature[];
  overpass: OverpassFeature[]; ports: PortFeature[]; ais: AisFeature[];
};

export function useMapLayers({ layers: on, data, zoom }: { layers: LayerState; data: Data; zoom: number }): Layer[] {
  return useMemo(() => {
    return [
      on.firms && new HeatmapLayer<FirmsFeature>({
        id: 'firms', data: data.firms, pickable: true,
        getPosition: (d) => [d.longitude, d.latitude],
        getWeight: (d) => Math.max(1, d.frp),
        radiusPixels: 50, intensity: 1, threshold: 0.02,
        colorRange: [[255,255,178,25],[254,204,92,90],[253,141,60,130],[240,59,32,180],[189,0,38,220]],
      }),
      on.gdelt && new ScatterplotLayer<GdeltFeature>({
        id: 'gdelt', data: data.gdelt, pickable: true, radiusUnits: 'meters',
        getPosition: (d) => [d.actionGeoLon, d.actionGeoLat],
        getRadius: (d) => Math.max(9000, d.numMentions * 2200),
        getFillColor: (d) => d.avgTone < -5 ? [231,106,110,180] : [236,154,60,150],
        getLineColor: [255,255,255,80], stroked: true, lineWidthMinPixels: 1,
      }),
      on.eonet && new IconLayer<EonetFeature>({
        id: 'eonet', data: data.eonet, pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => icon('eonet', d),
        getSize: (d) => evSize(d), ...eventProps(zoom),
      }),
      on.reference && new IconLayer<ReferenceFeature>({
        id: 'reference', data: data.reference.filter((d) => referencePosition(d) !== null), pickable: true,
        getPosition: (d) => referencePosition(d)!,
        getIcon: (d) => icon('reference', d),
        getSize: (d) => refSize(d), ...siteProps(zoom),
      }),
      on.overpass && new IconLayer<OverpassFeature>({
        id: 'overpass', data: filterOverpass(data.overpass), pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => icon('overpass', d),
        getSize: (d) => ovSize(d), ...siteProps(zoom),
      }),
      on.ports && new IconLayer<PortFeature>({
        id: 'ports', data: data.ports, pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => icon('port', d),
        getSize: (d) => d.harborSize === 'Large' ? 24 : d.harborSize === 'Medium' ? 20 : 16, ...portProps(zoom),
      }),
      on.ais && new IconLayer<AisFeature>({
        id: 'ais', data: data.ais, pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => icon('ais', d),
        getAngle: (d) => -(d.heading ?? 0),
        getSize: 10, ...mobileProps(zoom),
      }),
      on.usgs && new IconLayer<UsgsFeature>({
        id: 'usgs', data: data.usgs, pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => icon('usgs', d),
        getSize: (d) => Math.max(12, Math.min(22, d.magnitude * 3.5)), ...eventProps(zoom),
      }),
      on.opensky && new IconLayer<OpenskyFeature>({
        id: 'opensky', data: data.opensky, pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => icon('opensky', d),
        getAngle: (d) => -(d.heading ?? 0),
        getSize: 10, ...mobileProps(zoom),
      }),
    ].filter(Boolean) as Layer[];
  }, [on, data, zoom]);
}

export { getTooltip } from '@/features/map/lib/tooltip';
