'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import DeckGL from '@deck.gl/react';
import { ArcLayer, ScatterplotLayer, TextLayer, PolygonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PickingInfo } from '@deck.gl/core';
import type { MapViewState } from '@deck.gl/core';

import {
  STRIKE_ARCS,
  MISSILE_TRACKS,
  TARGETS,
  ALLIED_ASSETS,
  THREAT_ZONES,
  HEAT_POINTS,
  type StrikeArc,
  type MissileTrack,
  type Target,
  type Asset,
  type ThreatZone,
  type HeatPoint,
} from '@/data/mapData';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 51.0,
  latitude: 30.0,
  zoom: 4.5,
  pitch: 0,
  bearing: 0,
};

interface LayerVisibility {
  strikes: boolean;
  missiles: boolean;
  targets: boolean;
  assets: boolean;
  zones: boolean;
  heat: boolean;
}

type TooltipObject = StrikeArc | MissileTrack | Target | Asset | ThreatZone | HeatPoint;

export default function IntelMap() {
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [visibility, setVisibility] = useState<LayerVisibility>({
    strikes: true,
    missiles: true,
    targets: true,
    assets: true,
    zones: true,
    heat: true,
  });

  const toggleLayer = (key: keyof LayerVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const layers = useMemo(() => [
    visibility.heat &&
      new HeatmapLayer<HeatPoint>({
        id: 'heat',
        data: HEAT_POINTS,
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

    visibility.zones &&
      new PolygonLayer<ThreatZone>({
        id: 'zones',
        data: THREAT_ZONES,
        getPolygon: (d: ThreatZone): [number, number][] => d.coordinates,
        getFillColor: (d: ThreatZone): [number, number, number, number] => d.color,
        getLineColor: (d: ThreatZone): [number, number, number, number] => [d.color[0], d.color[1], d.color[2], 200],
        lineWidthMinPixels: 1,
        filled: true,
        stroked: true,
        pickable: true,
        autoHighlight: true,
      }),

    visibility.strikes &&
      new ArcLayer<StrikeArc>({
        id: 'strikes',
        data: STRIKE_ARCS,
        getSourcePosition: (d: StrikeArc): [number, number] => d.from,
        getTargetPosition: (d: StrikeArc): [number, number] => d.to,
        getSourceColor: (d: StrikeArc): [number, number, number, number] =>
          d.type === 'NAVAL'
            ? [50, 200, 200, 220]
            : d.type === 'ISRAEL_STRIKE'
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

    visibility.missiles &&
      new ArcLayer<MissileTrack>({
        id: 'missiles',
        data: MISSILE_TRACKS,
        getSourcePosition: (d: MissileTrack): [number, number] => d.from,
        getTargetPosition: (d: MissileTrack): [number, number] => d.to,
        getSourceColor: (): [number, number, number, number] => [210, 50, 50, 220],
        getTargetColor: (d: MissileTrack): [number, number, number, number] =>
          d.intercepted ? [255, 200, 0, 200] : [255, 50, 50, 220],
        getWidth: (d: MissileTrack): number => (d.severity === 'CRITICAL' ? 3 : 2),
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getSourceColor: [],
          getTargetColor: [],
        },
      }),

    visibility.targets &&
      new ScatterplotLayer<Target>({
        id: 'targets',
        data: TARGETS,
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

    visibility.assets &&
      new ScatterplotLayer<Asset>({
        id: 'assets',
        data: ALLIED_ASSETS,
        getPosition: (d: Asset): [number, number] => d.position,
        getRadius: (d: Asset): number => (d.type === 'CARRIER' ? 20000 : 14000),
        getFillColor: (d: Asset): [number, number, number, number] =>
          d.nation === 'US' ? [45, 114, 210, 220] : [50, 200, 200, 220],
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

    visibility.targets &&
      new TextLayer<Target>({
        id: 'target-labels',
        data: TARGETS,
        getPosition: (d: Target): [number, number] => d.position,
        getText: (d: Target): string => d.name,
        getSize: 11,
        getColor: (): [number, number, number, number] => [220, 220, 220, 200],
        getPixelOffset: (): [number, number] => [0, -20],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        background: true,
        getBackgroundColor: (): [number, number, number, number] => [28, 33, 39, 200],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      }),

    visibility.assets &&
      new TextLayer<Asset>({
        id: 'asset-labels',
        data: ALLIED_ASSETS,
        getPosition: (d: Asset): [number, number] => d.position,
        getText: (d: Asset): string => d.name,
        getSize: 10,
        getColor: (): [number, number, number, number] => [150, 200, 255, 200],
        getPixelOffset: (): [number, number] => [0, -22],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        background: true,
        getBackgroundColor: (): [number, number, number, number] => [28, 33, 39, 200],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      }),

  ].filter(Boolean), [visibility]);

  const getTooltip = useCallback(({ object, layer }: PickingInfo<TooltipObject>) => {
    if (!object) return null;
    const layerId = layer?.id ?? '';
    let html = '';

    if (layerId === 'strikes') {
      const d = object as StrikeArc;
      const typeLabel = d.type === 'NAVAL' ? 'NAVAL STRIKE' : d.type === 'ISRAEL_STRIKE' ? 'IDF STRIKE' : 'US STRIKE';
      const typeColor = d.type === 'NAVAL' ? '#32C8C8' : d.type === 'ISRAEL_STRIKE' ? '#32C878' : '#4C9BE8';
      html = `
        <div style="font-weight:700;font-size:11px;color:#E8E8E8;margin-bottom:6px">${d.label}</div>
        <div style="color:${typeColor};font-size:10px;margin-bottom:2px">TYPE: ${typeLabel}</div>
        <div style="color:${d.severity === 'CRITICAL' ? '#E84C4C' : '#E8A84C'};font-size:10px">SEVERITY: ${d.severity}</div>
      `;
    } else if (layerId === 'missiles') {
      const d = object as MissileTrack;
      html = `
        <div style="font-weight:700;font-size:11px;color:#E84C4C;margin-bottom:6px">${d.label}</div>
        <div style="color:#E84C4C;font-size:10px;margin-bottom:2px">TYPE: IRGC BALLISTIC MISSILE</div>
        <div style="color:${d.severity === 'CRITICAL' ? '#E84C4C' : '#E8A84C'};font-size:10px;margin-bottom:2px">SEVERITY: ${d.severity}</div>
        <div style="color:${d.intercepted ? '#FFC800' : '#E84C4C'};font-size:10px">STATUS: ${d.intercepted ? '✓ INTERCEPTED' : '⚠ IMPACT CONFIRMED'}</div>
      `;
    } else if (layerId === 'targets') {
      const d = object as Target;
      const statusColor = d.status === 'DESTROYED' ? '#E84C4C' : d.status === 'DAMAGED' ? '#E8A84C' : '#E8E84C';
      const typeColor = d.type === 'NUCLEAR' ? '#B84CE8' : d.type === 'MILITARY' ? '#E84C4C' : d.type === 'NAVAL' ? '#4C9BE8' : '#8F99A8';
      html = `
        <div style="font-weight:700;font-size:12px;color:#E8E8E8;margin-bottom:6px">${d.name}</div>
        <div style="display:flex;gap:4px;margin-bottom:6px">
          <span style="background:${typeColor}22;border:1px solid ${typeColor};color:${typeColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.type}</span>
          <span style="background:${statusColor}22;border:1px solid ${statusColor};color:${statusColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.status}</span>
        </div>
        <div style="color:#C0C8D4;font-size:10px;line-height:1.5">${d.description}</div>
      `;
    } else if (layerId === 'assets') {
      const d = object as Asset;
      const nationColor = d.nation === 'US' ? '#4C9BE8' : '#32C8C8';
      let extraLine = '';
      if (d.type === 'CARRIER') {
        extraLine = `<div style="color:#E8E84C;font-size:10px;margin-top:4px;font-weight:700">▶ CARRIER STRIKE GROUP</div>`;
      }
      html = `
        <div style="font-weight:700;font-size:12px;color:#E8E8E8;margin-bottom:6px">${d.name}</div>
        <div style="display:flex;gap:4px;margin-bottom:4px">
          <span style="background:${nationColor}22;border:1px solid ${nationColor};color:${nationColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.nation}</span>
          <span style="background:#2A2F38;border:1px solid #404854;color:#8F99A8;font-size:8px;padding:1px 5px;border-radius:2px">${d.type}</span>
        </div>
        ${d.description ? `<div style="color:#C0C8D4;font-size:10px;line-height:1.5;margin-top:4px">${d.description}</div>` : ''}
        ${extraLine}
      `;
    } else if (layerId === 'zones') {
      const d = object as ThreatZone;
      const zoneColor = d.type === 'CLOSURE' ? '#E84C4C' : d.type === 'PATROL' ? '#E8A84C' : d.type === 'NFZ' ? '#E8E84C' : '#E84C4C';
      html = `
        <div style="font-weight:700;font-size:11px;color:#E8E8E8;margin-bottom:4px">${d.name}</div>
        <div style="color:${zoneColor};font-size:10px">TYPE: ${d.type}</div>
      `;
    } else {
      const obj = object as unknown as Record<string, unknown>;
      const hasContent = obj.label || obj.name;
      if (!hasContent) return null;
      html = `<div style="font-size:11px;color:#E8E8E8">${String(obj.label ?? obj.name ?? '')}</div>`;
    }

    if (!html) return null;
    return {
      html: `<div style="background:#1C2127;border:1px solid #404854;padding:8px 10px;font-family:monospace;max-width:260px;border-radius:2px">${html}</div>`,
      style: { backgroundColor: 'transparent', border: 'none', padding: '0' },
    };
  }, []);

  const buttonConfig: Array<{
    key: keyof LayerVisibility;
    label: string;
    active: { bg: string; border: string; color: string };
  }> = [
    { key: 'strikes', label: 'STRIKES', active: { bg: '#1C3A5E', border: '#2D72D2', color: '#4C9BE8' } },
    { key: 'missiles', label: 'MISSILES', active: { bg: '#3A1C1C', border: '#D23232', color: '#E84C4C' } },
    { key: 'targets', label: 'TARGETS', active: { bg: '#3A2A1C', border: '#D27832', color: '#E8A84C' } },
    { key: 'assets', label: 'ASSETS', active: { bg: '#1C3A3A', border: '#32C8C8', color: '#4CE8E8' } },
    { key: 'zones', label: 'ZONES', active: { bg: '#3A3A1C', border: '#C8C832', color: '#E8E84C' } },
    { key: 'heat', label: 'HEAT', active: { bg: '#2A1C3A', border: '#8232D2', color: '#B84CE8' } },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1C2127' }}>
      {/* Title Bar */}
      <div
        style={{
          height: 36,
          background: 'var(--bg-app)',
          borderBottom: '1px solid var(--bd)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#2D72D2', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>◈ INTEL MAP</span>
        <span style={{ color: '#8F99A8', fontSize: 9, fontFamily: 'monospace', marginLeft: 4 }}>
          OPERATION EPIC FURY
        </span>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#32C832',
            display: 'inline-block',
            marginLeft: 4,
          }}
        />
        <span style={{ color: '#32C832', fontSize: 9, fontFamily: 'monospace' }}>LIVE</span>

        {/* Toggle buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {buttonConfig.map(({ key, label, active }) => {
            const isActive = visibility[key];
            return (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                style={{
                  padding: '2px 6px',
                  borderRadius: 2,
                  fontSize: 8,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  border: `1px solid ${isActive ? active.border : '#404854'}`,
                  background: isActive ? active.bg : '#252A31',
                  color: isActive ? active.color : '#5C7080',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
          controller={true}
          layers={layers}
          getTooltip={getTooltip as (info: PickingInfo) => ReturnType<typeof getTooltip>}
          style={{ width: '100%', height: '100%' }}
        >
          <Map mapStyle={MAP_STYLE} />
        </DeckGL>

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 12,
            background: 'rgba(28,33,39,0.92)',
            border: '1px solid #404854',
            borderRadius: 2,
            padding: '10px 12px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 8, color: '#5C7080', marginBottom: 6 }}>LEGEND</div>
          {[
            { color: '#2D72D2', shape: 'rect', label: 'US STRIKE TRACK' },
            { color: '#32C878', shape: 'rect', label: 'IDF STRIKE TRACK' },
            { color: '#32C8C8', shape: 'rect', label: 'NAVAL STRIKE' },
            { color: '#D23232', shape: 'rect', label: 'HOSTILE MISSILE' },
            { color: '#FFC800', shape: 'rect', label: 'INTERCEPTED MISSILE' },
            { color: '#DC3232', shape: 'circle', label: 'DESTROYED TARGET' },
            { color: '#DC9632', shape: 'circle', label: 'DAMAGED TARGET' },
            { color: '#DCC832', shape: 'circle', label: 'TARGETED' },
            { color: '#2D72D2', shape: 'circle', label: 'US ASSET' },
            { color: '#32C8C8', shape: 'circle', label: 'IDF ASSET' },
            { color: '#DC3232', shape: 'zone', label: 'CLOSURE ZONE' },
            { color: '#DC9632', shape: 'zone', label: 'PATROL ZONE' },
          ].map(({ color, shape, label }) => (
            <div
              key={label}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, fontSize: 9, color: '#8F99A8' }}
            >
              {shape === 'rect' ? (
                <div style={{ width: 12, height: 3, background: color, flexShrink: 0 }} />
              ) : shape === 'zone' ? (
                <div style={{ width: 10, height: 8, background: color + '44', border: `1px solid ${color}`, flexShrink: 0 }} />
              ) : (
                <div
                  style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}
                />
              )}
              {label}
            </div>
          ))}
        </div>

        {/* Coords */}
        <div
          style={{
            position: 'absolute',
            bottom: 52,
            right: 12,
            background: 'rgba(28,33,39,0.85)',
            border: '1px solid #404854',
            padding: '4px 8px',
            fontSize: 9,
            fontFamily: 'monospace',
            color: '#5C7080',
            pointerEvents: 'none',
          }}
        >
          {viewState.latitude.toFixed(2)}°N {viewState.longitude.toFixed(2)}°E
        </div>

        {/* Open Full Map Button */}
        <OpenMapButton />
      </div>
    </div>
  );
}

function OpenMapButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/dashboard/map"
      style={{
        position: 'absolute',
        bottom: 16,
        right: 12,
        background: hovered ? '#1F4F9B' : '#2D72D2',
        color: 'white',
        padding: '8px 16px',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'monospace',
        border: 'none',
        borderRadius: 2,
        cursor: 'pointer',
        letterSpacing: '0.08em',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'background 0.15s ease',
        zIndex: 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ⤢&nbsp;&nbsp;OPEN FULL MAP
    </Link>
  );
}
