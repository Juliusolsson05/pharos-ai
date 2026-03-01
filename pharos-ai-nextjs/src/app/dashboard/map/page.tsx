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
import { MAP_STORIES, type MapStory, type StoryEvent } from '@/data/mapStories';
import StoryIcon from '@/components/dashboard/StoryIcon';
import StoryTimeline from '@/components/dashboard/StoryTimeline';

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

const CATEGORY_COLORS: Record<MapStory['category'], { bg: string; text: string }> = {
  STRIKE: { bg: '#2D1C1C', text: '#E84C4C' },
  RETALIATION: { bg: '#3A1C1C', text: '#E84C4C' },
  NAVAL: { bg: '#1C2A3A', text: '#4C9BE8' },
  INTEL: { bg: '#2A1C3A', text: '#B84CE8' },
  DIPLOMATIC: { bg: '#1C3A2A', text: '#4CE8A8' },
};

function StoryCard({
  story,
  isOpen,
  onToggle,
  onFlyTo,
}: {
  story: MapStory;
  isOpen: boolean;
  onToggle: () => void;
  onFlyTo: () => void;
}) {
  const catColor = CATEGORY_COLORS[story.category];
  return (
    <div
      style={{
        borderBottom: '1px solid #2A2F38',
      }}
    >
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          background: isOpen ? '#252A31' : 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) (e.currentTarget as HTMLDivElement).style.background = '#252A31';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <StoryIcon iconName={story.iconName} category={story.category} size={15} boxSize={28} style={{ marginRight: 10 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: '#E8E8E8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {story.title}
            </div>
            <div style={{ fontSize: 11, color: '#8F99A8', marginTop: 2 }}>{story.tagline}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, flexShrink: 0 }}>
            <span
              style={{
                background: catColor.bg,
                color: catColor.text,
                fontSize: 8,
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '2px 5px',
                borderRadius: 2,
              }}
            >
              {story.category}
            </span>
            <span style={{ color: '#5C7080', fontSize: 12 }}>{isOpen ? '∨' : '›'}</span>
          </div>
        </div>
      </div>

      {/* Expanded body */}
      {isOpen && (
        <div style={{ background: '#1A1F25', padding: '12px 16px' }}>

          {/* Narrative */}
          <p style={{ fontSize: 12, color: '#C0C8D4', lineHeight: 1.6, margin: '0 0 12px 0' }}>
            {story.narrative}
          </p>

          {/* Event timeline */}
          {story.events.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontFamily: 'monospace', fontWeight: 700, color: '#5C7080', letterSpacing: '0.1em', marginBottom: 8 }}>
                EVENT LOG
              </div>
              <div style={{ position: 'relative', paddingLeft: 16 }}>
                {/* Vertical connector line */}
                <div style={{
                  position: 'absolute', left: 5, top: 6,
                  width: 1, bottom: 6, background: '#2A2F38',
                }} />
                {story.events.map((ev: StoryEvent, i: number) => {
                  const evColor: Record<string, string> = {
                    STRIKE: '#E84C4C', RETALIATION: '#E8A84C',
                    INTEL: '#B84CE8', NAVAL: '#4C9BE8', POLITICAL: '#8F99A8',
                  };
                  const c = evColor[ev.type] ?? '#8F99A8';
                  const t = new Date(ev.time);
                  const hhmm = t.getUTCHours().toString().padStart(2,'0') + ':' + t.getUTCMinutes().toString().padStart(2,'0') + 'Z';
                  const day = t.getUTCDate() === 28 ? 'FEB 28' : 'MAR 01';
                  return (
                    <div key={i} style={{ position: 'relative', marginBottom: i < story.events.length - 1 ? 10 : 0 }}>
                      {/* Dot on the line */}
                      <div style={{
                        position: 'absolute', left: -12, top: 4,
                        width: 7, height: 7, borderRadius: '50%',
                        background: c, border: `1px solid ${c}88`,
                        boxShadow: `0 0 4px ${c}66`,
                      }} />
                      {/* Timestamp */}
                      <div style={{ fontFamily: 'monospace', fontSize: 9, color: c, fontWeight: 700, marginBottom: 1 }}>
                        {day} · {hhmm}
                      </div>
                      {/* Label */}
                      <div style={{ fontSize: 11, color: '#8F99A8', lineHeight: 1.4 }}>
                        {ev.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key facts */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 8, fontFamily: 'monospace', fontWeight: 700, color: '#5C7080', letterSpacing: '0.1em', marginBottom: 6 }}>
              KEY FACTS
            </div>
            {story.keyFacts.map((fact, i) => (
              <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, color: '#8F99A8', marginBottom: 3 }}>
                → {fact}
              </div>
            ))}
          </div>

          {/* Fly to */}
          <button
            onClick={onFlyTo}
            style={{
              width: '100%', padding: 6,
              background: '#1C3A5E', border: '1px solid #2D72D2',
              color: '#4C9BE8', fontSize: 10, fontWeight: 700,
              fontFamily: 'monospace', cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            ⊙ FLY TO
          </button>
        </div>
      )}
    </div>
  );
}

export default function FullMapPage() {
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openStoryId, setOpenStoryId] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<MapStory | null>(null);
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

  const activateStory = (story: MapStory) => {
    setActiveStory(story);
    setViewState((prev) => ({
      ...prev,
      longitude: story.viewState.longitude,
      latitude: story.viewState.latitude,
      zoom: story.viewState.zoom,
      transitionDuration: 1200,
    }));
  };

  const clearStory = () => {
    setActiveStory(null);
  };

  // Helper: is dim mode active?
  const dimActive = activeStory !== null;

  const getStrikeColor = (d: StrikeArc): [number, number, number, number] => {
    if (dimActive && !activeStory!.highlightStrikeIds.includes(d.id)) {
      return [45, 114, 210, 40];
    }
    return d.type === 'NAVAL'
      ? [50, 200, 200, 220]
      : d.type === 'ISRAEL_STRIKE'
      ? [50, 200, 120, 220]
      : [45, 114, 210, 220];
  };

  const getMissileSourceColor = (d: MissileTrack): [number, number, number, number] => {
    if (dimActive && !activeStory!.highlightMissileIds.includes(d.id)) {
      return [210, 50, 50, 30];
    }
    return [210, 50, 50, 220];
  };

  const getMissileTargetColor = (d: MissileTrack): [number, number, number, number] => {
    if (dimActive && !activeStory!.highlightMissileIds.includes(d.id)) {
      return [210, 50, 50, 30];
    }
    return d.intercepted ? [255, 200, 0, 200] : [255, 50, 50, 220];
  };

  const getTargetFillColor = (d: Target): [number, number, number, number] => {
    const baseColor: [number, number, number, number] =
      d.status === 'DESTROYED'
        ? [220, 50, 50, 200]
        : d.status === 'DAMAGED'
        ? [220, 150, 50, 200]
        : [220, 200, 50, 200];
    if (dimActive && !activeStory!.highlightTargetIds.includes(d.id)) {
      return [baseColor[0], baseColor[1], baseColor[2], 40];
    }
    return baseColor;
  };

  const getAssetFillColor = (d: Asset): [number, number, number, number] => {
    const baseColor: [number, number, number, number] =
      d.nation === 'US' ? [45, 114, 210, 220] : [50, 200, 200, 220];
    if (dimActive && !activeStory!.highlightAssetIds.includes(d.id)) {
      return [baseColor[0], baseColor[1], baseColor[2], 40];
    }
    return baseColor;
  };

  const layers = useMemo(() => [
    visibility.heat &&
      new HeatmapLayer<HeatPoint>({
        id: 'heat',
        data: HEAT_POINTS,
        getPosition: (d: HeatPoint): [number, number] => d.position,
        getWeight: (d: HeatPoint): number => d.weight,
        radiusPixels: 60,
        intensity: dimActive ? 0.3 : 1,
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
        getFillColor: (d: ThreatZone): [number, number, number, number] =>
          dimActive ? [d.color[0], d.color[1], d.color[2], 20] : d.color,
        getLineColor: (d: ThreatZone): [number, number, number, number] =>
          dimActive ? [d.color[0], d.color[1], d.color[2], 40] : [d.color[0], d.color[1], d.color[2], 200],
        lineWidthMinPixels: 1,
        filled: true,
        stroked: true,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: [dimActive],
          getLineColor: [dimActive],
        },
      }),

    visibility.strikes &&
      new ArcLayer<StrikeArc>({
        id: 'strikes',
        data: STRIKE_ARCS,
        getSourcePosition: (d: StrikeArc): [number, number] => d.from,
        getTargetPosition: (d: StrikeArc): [number, number] => d.to,
        getSourceColor: getStrikeColor,
        getTargetColor: (d: StrikeArc): [number, number, number, number] =>
          dimActive && !activeStory!.highlightStrikeIds.includes(d.id)
            ? [255, 255, 255, 30]
            : [255, 255, 255, 180],
        getWidth: (d: StrikeArc): number => (d.severity === 'CRITICAL' ? 3 : 2),
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getSourceColor: activeStory ? [activeStory.id] : [],
          getTargetColor: activeStory ? [activeStory.id] : [],
        },
      }),

    visibility.missiles &&
      new ArcLayer<MissileTrack>({
        id: 'missiles',
        data: MISSILE_TRACKS,
        getSourcePosition: (d: MissileTrack): [number, number] => d.from,
        getTargetPosition: (d: MissileTrack): [number, number] => d.to,
        getSourceColor: getMissileSourceColor,
        getTargetColor: getMissileTargetColor,
        getWidth: (d: MissileTrack): number => (d.severity === 'CRITICAL' ? 3 : 2),
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getSourceColor: activeStory ? [activeStory.id] : [],
          getTargetColor: activeStory ? [activeStory.id] : [],
        },
      }),

    visibility.targets &&
      new ScatterplotLayer<Target>({
        id: 'targets',
        data: TARGETS,
        getPosition: (d: Target): [number, number] => d.position,
        getRadius: (d: Target): number =>
          d.status === 'DESTROYED' ? 18000 : d.status === 'DAMAGED' ? 14000 : 10000,
        getFillColor: getTargetFillColor,
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: activeStory ? [activeStory.id] : [],
          getLineColor: activeStory ? [activeStory.id] : [],
        },
      }),

    visibility.assets &&
      new ScatterplotLayer<Asset>({
        id: 'assets',
        data: ALLIED_ASSETS,
        getPosition: (d: Asset): [number, number] => d.position,
        getRadius: (d: Asset): number => (d.type === 'CARRIER' ? 20000 : 14000),
        getFillColor: getAssetFillColor,
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 150],
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: activeStory ? [activeStory.id] : [],
          getLineColor: activeStory ? [activeStory.id] : [],
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


  ].filter(Boolean), [visibility, activeStory, dimActive,
    getStrikeColor, getMissileSourceColor, getMissileTargetColor,
    getTargetFillColor, getAssetFillColor]);

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
      const typeColor =
        d.type === 'NUCLEAR' ? '#B84CE8' : d.type === 'MILITARY' ? '#E84C4C' : d.type === 'NAVAL' ? '#4C9BE8' : '#8F99A8';
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
      const zoneColor =
        d.type === 'CLOSURE' ? '#E84C4C' : d.type === 'PATROL' ? '#E8A84C' : d.type === 'NFZ' ? '#E8E84C' : '#E84C4C';
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
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: '#1C2127',
        overflow: 'hidden',
        fontFamily: 'SFMono-Regular, Menlo, monospace',
      }}
    >
      {/* Left Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 320 : 48,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#1C2127',
          borderRight: '1px solid #404854',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            height: 44,
            background: '#1C2127',
            borderBottom: '1px solid #404854',
            display: 'flex',
            alignItems: 'center',
            padding: sidebarOpen ? '0 12px' : '0',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            flexShrink: 0,
            gap: 6,
          }}
        >
          {sidebarOpen ? (
            <>
              <span style={{ color: '#2D72D2', fontWeight: 700, fontSize: 12 }}>◈ STORIES</span>
              <span
                style={{
                  background: '#2A2F38',
                  color: '#5C7080',
                  fontSize: 8,
                  padding: '2px 6px',
                  borderRadius: 2,
                  fontWeight: 700,
                  marginLeft: 4,
                }}
              >
                AI CURATED
              </span>
              <span
                style={{
                  background: '#1C3A5E',
                  color: '#4C9BE8',
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 10,
                  marginLeft: 2,
                }}
              >
                {MAP_STORIES.length}
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  color: '#5C7080',
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                  padding: '0 2px',
                }}
              >
                ‹
              </button>
            </>
          ) : (
            <span
              onClick={() => setSidebarOpen(true)}
              style={{ color: '#2D72D2', fontSize: 14, cursor: 'pointer', userSelect: 'none' }}
            >
              ◈
            </span>
          )}
        </div>

        {/* Timeline strip — only when expanded */}
        {sidebarOpen && (
          <StoryTimeline
            stories={MAP_STORIES}
            activeId={activeStory?.id ?? null}
            onActivate={(story) => {
              setOpenStoryId(story.id);
              activateStory(story);
            }}
          />
        )}

        {/* Stories list */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {sidebarOpen
            ? MAP_STORIES.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  isOpen={openStoryId === story.id}
                  onToggle={() => {
                    const opening = openStoryId !== story.id;
                    setOpenStoryId(opening ? story.id : null);
                    if (opening) activateStory(story);
                    else clearStory();
                  }}
                  onFlyTo={() => activateStory(story)}
                />
              ))
            : MAP_STORIES.map((story) => (
                <div
                  key={story.id}
                  title={story.title}
                  onClick={() => {
                    setSidebarOpen(true);
                    setOpenStoryId(story.id);
                    activateStory(story);
                  }}
                  style={{
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 16,
                    borderBottom: '1px solid #2A2F38',
                    background: activeStory?.id === story.id ? '#252A31' : 'transparent',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#252A31')}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      activeStory?.id === story.id ? '#252A31' : 'transparent';
                  }}
                >
                  <StoryIcon iconName={story.iconName} category={story.category} size={14} boxSize={32} />
                </div>
              ))}
        </div>
      </div>

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* DeckGL map */}
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

        {/* Back button — top left */}
        <BackButton />

        {/* Active story pill — top center */}
        {activeStory && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(28,33,39,0.95)',
              border: '1px solid #404854',
              borderRadius: 2,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          >
            <StoryIcon iconName={activeStory.iconName} category={activeStory.category} size={12} boxSize={22} />
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#E8E8E8', fontWeight: 700 }}>
              STORY: {activeStory.title.toUpperCase()}
            </span>
            <button
              onClick={clearStory}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#5C7080',
                cursor: 'pointer',
                fontSize: 13,
                lineHeight: 1,
                padding: '0 2px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Toggle toolbar — top right */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(28,33,39,0.92)',
            border: '1px solid #404854',
            borderRadius: 2,
            padding: '6px 8px',
            display: 'flex',
            gap: 4,
            zIndex: 10,
          }}
        >
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

        {/* Legend — bottom left */}
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
                <div
                  style={{
                    width: 10,
                    height: 8,
                    background: color + '44',
                    border: `1px solid ${color}`,
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              )}
              {label}
            </div>
          ))}
        </div>

        {/* Coords — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
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
      </div>
    </div>
  );
}

function BackButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/dashboard"
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        background: hovered ? '#1F4F9B' : '#2D72D2',
        color: 'white',
        padding: '6px 12px',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'monospace',
        border: 'none',
        borderRadius: 2,
        cursor: 'pointer',
        letterSpacing: '0.06em',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'background 0.15s ease',
        zIndex: 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ← BACK TO OVERVIEW
    </Link>
  );
}
