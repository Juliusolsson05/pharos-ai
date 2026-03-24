'use client';

import { useCallback,useState } from 'react';

import Link from 'next/link';

import type { MapViewState,PickingInfo } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';

import { Button } from '@/components/ui/button';

import { useMapData } from '@/features/map/queries';

import { type LayerVisibility, type TooltipObject,useMapLayers } from './intel-map-layers';
import { getMapTooltip } from './intel-map-tooltip';
import { IntelMapLegend } from './IntelMapLegend';

import '@/features/map/lib/deckgl-device';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 51.0, latitude: 30.0, zoom: 4.5, pitch: 0, bearing: 0,
};

const BUTTON_CONFIG: Array<{
  key: keyof LayerVisibility;
  label: string;
  active: { bg: string; border: string; color: string };
}> = [
  { key: 'strikes',  label: 'STRIKES',  active: { bg: 'var(--blue-dim)', border: 'var(--blue)', color: 'var(--blue-l)' } },
  { key: 'missiles', label: 'MISSILES', active: { bg: 'var(--danger-dim)', border: 'var(--danger)', color: 'var(--danger)' } },
  { key: 'targets',  label: 'TARGETS',  active: { bg: 'var(--warning-dim)', border: 'var(--warning)', color: 'var(--warning)' } },
  { key: 'assets',   label: 'ASSETS',   active: { bg: 'var(--teal-dim)', border: 'var(--teal)', color: 'var(--teal)' } },
  { key: 'zones',    label: 'ZONES',    active: { bg: 'var(--gold-dim)', border: 'var(--gold)', color: 'var(--gold)' } },
  { key: 'heat',     label: 'HEAT',     active: { bg: 'var(--cyber-dim)', border: 'var(--cyber)', color: 'var(--cyber)' } },
];

const DEFAULT_VISIBILITY: LayerVisibility = {
  strikes: true, missiles: true, targets: true, assets: true, zones: true, heat: true,
};

export function IntelMap() {
  const { data: mapData } = useMapData();
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [visibility, setVisibility] = useState<LayerVisibility>(DEFAULT_VISIBILITY);

  const toggleLayer = (key: keyof LayerVisibility) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const layers = useMapLayers(visibility, mapData);
  const getTooltip = useCallback(
    (info: PickingInfo) => getMapTooltip(info as PickingInfo<TooltipObject>),
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)' }}>
      {/* Title Bar */}
      <div style={{ height: 36, background: 'var(--bg-app)', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 }}>
        <span style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 'var(--text-body-sm)', fontFamily: 'monospace' }}>◈ INTEL MAP</span>
        <span style={{ color: 'var(--t3)', fontSize: 'var(--text-caption)', fontFamily: 'monospace', marginLeft: 4 }}>OPERATION EPIC FURY</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', marginLeft: 4 }} />
        <span style={{ color: 'var(--success)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>LIVE</span>

        {/* Toggle buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {BUTTON_CONFIG.map(({ key, label, active }) => {
            const on = visibility[key];
            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => toggleLayer(key)}
                className="h-auto px-1.5 py-0.5 rounded-sm text-[length:var(--text-tiny)] font-bold mono"
                style={{
                  border: `1px solid ${on ? active.border : 'var(--bd)'}`,
                  background: on ? active.bg : 'var(--bg-1)',
                  color: on ? active.color : 'var(--t4)',
                }}
              >
                {label}
              </Button>
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
          getTooltip={getTooltip}
          style={{ width: '100%', height: '100%' }}
        >
          <Map mapStyle={MAP_STYLE} />
        </DeckGL>

        <IntelMapLegend />

        {/* Coords */}
        <div style={{ position: 'absolute', bottom: 52, right: 12, background: 'rgba(28,33,39,0.85)', border: '1px solid var(--bd)', padding: '4px 8px', fontSize: 'var(--text-caption)', fontFamily: 'monospace', color: 'var(--t4)', pointerEvents: 'none' }}>
          {viewState.latitude.toFixed(2)}°N {viewState.longitude.toFixed(2)}°E
        </div>

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
        position: 'absolute', bottom: 16, right: 12,
        background: hovered ? 'var(--blue)' : 'var(--blue)',
        color: 'white', padding: '8px 16px', fontSize: 'var(--text-body-sm)', fontWeight: 700,
        fontFamily: 'monospace', border: 'none', borderRadius: 2,
        cursor: 'pointer', letterSpacing: '0.08em', textDecoration: 'none',
        display: 'inline-block', transition: 'background 0.15s ease', zIndex: 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ⤢&nbsp;&nbsp;OPEN FULL MAP
    </Link>
  );
}
