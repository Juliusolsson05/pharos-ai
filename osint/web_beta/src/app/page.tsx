'use client';

import { useCallback, useMemo } from 'react';

import type { MapViewState, PickingInfo } from '@deck.gl/core';

import { MapCanvas } from '@/features/map/components/MapCanvas';
import { MapControls } from '@/features/map/components/MapControls';
import { MapDetailPanel } from '@/features/map/components/MapDetailPanel';
import { MapLegend } from '@/features/map/components/MapLegend';
import { MapTimingPanel } from '@/features/map/components/MapTimingPanel';
import { useBatchData, useManifest, useReference } from '@/features/map/hooks/use-osint-data';
import { getTooltip, useMapLayers } from '@/features/map/hooks/use-map-layers';
import { useAppDispatch, useAppSelector } from '@/features/map/state/hooks';
import { setSelected, setViewState } from '@/features/map/state/map-slice';
import type { FetchTiming } from '@/features/map/hooks/use-osint-data';

const EMPTY_BATCH = {
  gdelt: [] as never[], firms: [] as never[], usgs: [] as never[],
  opensky: [] as never[], eonet: [] as never[], overpass: [] as never[],
  ports: [] as never[], ais: [] as never[],
};

export default function Page() {
  const dispatch = useAppDispatch();
  const viewState = useAppSelector((s) => s.map.viewState);
  const enabled = useAppSelector((s) => s.map.layers);
  const showNightlights = useAppSelector((s) => s.map.showNightlights);
  const selected = useAppSelector((s) => s.map.selected);

  const manifestQuery = useManifest();
  const referenceQuery = useReference();
  const batchQuery = useBatchData();

  const isLoading = manifestQuery.isLoading || referenceQuery.isLoading || batchQuery.isLoading;

  const reference = referenceQuery.data?.data.items ?? [];
  const batch = batchQuery.extracted ?? EMPTY_BATCH;
  const manifest = manifestQuery.data?.data ?? null;

  const data = useMemo(() => ({ reference, ...batch }), [reference, batch]);

  const layers = useMapLayers({ layers: enabled, data, zoom: viewState.zoom });

  const total = reference.length + batch.gdelt.length + batch.firms.length
    + batch.usgs.length + batch.opensky.length + batch.eonet.length
    + batch.overpass.length + batch.ports.length + batch.ais.length;

  const timing = useMemo<{ totalMs: number; providers: FetchTiming[] }>(() => {
    if (isLoading) return { totalMs: 0, providers: [] };
    const batchMs = batchQuery.data?.ms ?? 0;
    const batchCount = Object.values(batch).reduce((s, a) => s + a.length, 0);
    const providers: FetchTiming[] = [
      { name: 'batch', ms: batchMs, count: batchCount },
      { name: 'reference', ms: referenceQuery.data?.ms ?? 0, count: reference.length },
      { name: 'manifest', ms: manifestQuery.data?.ms ?? 0, count: 1 },
    ].sort((a, b) => b.ms - a.ms);
    const totalMs = Math.max(batchMs, referenceQuery.data?.ms ?? 0, manifestQuery.data?.ms ?? 0);
    return { totalMs, providers };
  }, [isLoading, batchQuery.data, referenceQuery.data, manifestQuery.data, batch, reference]);

  const handleViewStateChange = useCallback((vs: MapViewState) => {
    dispatch(setViewState({
      longitude: vs.longitude,
      latitude: vs.latitude,
      zoom: vs.zoom,
      pitch: vs.pitch ?? 0,
      bearing: vs.bearing ?? 0,
    }));
  }, [dispatch]);

  const handleClick = useCallback((info: PickingInfo) => {
    if (info.object && info.layer) {
      dispatch(setSelected({ layer: info.layer.id, object: info.object as Record<string, unknown> }));
    } else {
      dispatch(setSelected(null));
    }
  }, [dispatch]);

  const handleCloseDetail = useCallback(() => dispatch(setSelected(null)), [dispatch]);

  const error = manifestQuery.error || referenceQuery.error || batchQuery.error;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">PHAROS / OSINT MAP BETA</div>
          <h1>OSINT Map V1</h1>
        </div>
        <div className="status-strip">
          <span>{isLoading ? 'LOADING' : `${total.toLocaleString()} features`}</span>
        </div>
      </header>

      <aside className="sidebar">
        <MapControls />
        <MapTimingPanel
          totalMs={timing.totalMs}
          providers={timing.providers}
          isLoading={isLoading}
        />
        <MapLegend />
        <div className="meta-block">
          <div>LAT {viewState.latitude.toFixed(2)}</div>
          <div>LON {viewState.longitude.toFixed(2)}</div>
          <div>ZOOM {viewState.zoom.toFixed(2)}</div>
        </div>
        {error ? <div className="error-box">{String(error)}</div> : null}
      </aside>

      <main className="map-frame">
        <MapCanvas
          viewState={viewState as MapViewState}
          layers={layers}
          manifest={manifest}
          showNightlights={showNightlights}
          onViewStateChange={handleViewStateChange}
          onClick={handleClick}
          getTooltip={getTooltip}
        />
        {selected ? (
          <MapDetailPanel
            layer={selected.layer}
            object={selected.object}
            onClose={handleCloseDetail}
          />
        ) : null}
      </main>
    </div>
  );
}
