'use client';

import { useCallback,useEffect, useMemo } from 'react';

import type { DataArrays, FilteredData, FilterFacets,FilterState } from '@/features/map/lib/map-filter-engine';
import { applyFilters, extractInitialState, extractTimeExtent } from '@/features/map/lib/map-filter-engine';
import { useMapData } from '@/features/map/queries';
import { selectFilterState, selectIsFiltered } from '@/features/map/state/map-selectors';
import {
  initializeFilters as initializeFiltersAction,
  resetFilters   as resetFiltersAction,
  setTimeRange   as setTimeRangeAction,
  setViewExtent  as setViewExtentAction,
  toggleActor    as toggleActorAction,
  toggleDataset  as toggleDatasetAction,
  toggleHeat     as toggleHeatAction,
  togglePriority as togglePriorityAction,
  toggleStatus   as toggleStatusAction,
  toggleType     as toggleTypeAction,
  toSerializable,
} from '@/features/map/state/map-slice';

import type { ActorMeta } from '@/data/map-tokens';

import { useAppDispatch,useAppSelector } from '@/shared/state';

export type { FilteredData, FilterFacets,FilterState };

// Dataset names

export type DatasetName = 'strikes' | 'missiles' | 'targets' | 'assets' | 'zones';

export const ALL_DATASETS: DatasetName[] = ['strikes', 'missiles', 'targets', 'assets', 'zones'];

export const DATASET_LABEL: Record<DatasetName, string> = {
  strikes: 'STRIKES', missiles: 'MISSILES', targets: 'TARGETS', assets: 'ASSETS', zones: 'ZONES',
};

function buildFingerprint(rawData: DataArrays): string {
  let minTs = Number.POSITIVE_INFINITY;
  let maxTs = Number.NEGATIVE_INFINITY;
  for (const entry of [...rawData.strikes, ...rawData.missiles, ...rawData.targets, ...rawData.assets, ...rawData.zones]) {
    if (!entry.timestamp) continue;
    const ts = new Date(entry.timestamp).getTime();
    if (!Number.isFinite(ts)) continue;
    if (ts < minTs) minTs = ts;
    if (ts > maxTs) maxTs = ts;
  }
  const stableMin = Number.isFinite(minTs) ? minTs : 0;
  const stableMax = Number.isFinite(maxTs) ? maxTs : 0;
  return [
    rawData.strikes.length,
    rawData.missiles.length,
    rawData.targets.length,
    rawData.assets.length,
    rawData.zones.length,
    rawData.heat.length,
    stableMin,
    stableMax,
  ].join('|');
}

// Empty fallback

const EMPTY_RESULT: { filtered: FilteredData; facets: FilterFacets } = {
  filtered: { strikes: [], missiles: [], targets: [], assets: [], zones: [], heat: [] },
  facets:   { datasets: [], perDataset: {}, totalVisible: 0, totalAll: 0 },
};

export type UseMapFiltersReturn = {
  state:    FilterState;
  filtered: FilteredData;
  facets:   FilterFacets;
  actorMeta: Record<string, ActorMeta>;
  rawData:  DataArrays | undefined;
  /** Absolute min/max of all timestamped data */
  dataExtent:   [number, number];
  /** Current visible window on the timeline (zoom level) */
  viewExtent:   [number, number];
  setViewExtent: (ext: [number, number]) => void;
  toggleDataset:  (d: string) => void;
  toggleType:     (t: string) => void;
  toggleActor:    (a: string) => void;
  togglePriority: (p: string) => void;
  toggleStatus:   (s: string) => void;
  toggleHeat:     () => void;
  setTimeRange:   (range: [number, number] | null) => void;
  resetFilters:   () => void;
  isFiltered:     boolean;
  isLoading:      boolean;
};

export function useMapFilters(): UseMapFiltersReturn {
  const dispatch   = useAppDispatch();
  const dataExtent = useAppSelector(s => s.map.dataExtent);
  const viewExtent = useAppSelector(s => s.map.viewExtent);
  const isFiltered = useAppSelector(selectIsFiltered);
  const filterState: FilterState = useAppSelector(selectFilterState);

  const { data: mapResult, isLoading } = useMapData();
  const rawData = mapResult;
  const actorMeta = useMemo(() => mapResult?.actorMeta ?? {}, [mapResult]);

  // Initialize Redux filter state once data arrives
  useEffect(() => {
    if (!rawData) return;
    const initial = extractInitialState(rawData);
    const extent  = extractTimeExtent(rawData);
    const fingerprint = buildFingerprint(rawData);
    dispatch(initializeFiltersAction({
      initialFilters: toSerializable(initial),
      dataExtent: extent,
      fingerprint,
    }));
  }, [rawData, dispatch]);

  // Compute filtered data + facets locally (replaces selectFilteredData)
  const { filtered, facets } = useMemo(
    () => rawData ? applyFilters(rawData, filterState, actorMeta) : EMPTY_RESULT,
    [rawData, filterState, actorMeta],
  );

  const datasetTypesMap = useMemo(() => {
    if (!rawData) return {} as Record<string, string[]>;
    const map: Record<string, string[]> = {};
    for (const key of ALL_DATASETS) {
      const items = rawData[key === 'zones' ? 'zones' : key] as Array<{ type: string }>;
      if (items) map[key] = [...new Set(items.map(i => i.type))];
    }
    return map;
  }, [rawData]);

  const setViewExtent = useCallback((ext: [number, number]) => dispatch(setViewExtentAction(ext)), [dispatch]);
  const toggleDataset = useCallback((d: string) => dispatch(toggleDatasetAction({ dataset: d, datasetTypes: datasetTypesMap[d] })), [dispatch, datasetTypesMap]);
  const toggleType    = useCallback((t: string) => dispatch(toggleTypeAction(t)), [dispatch]);
  const toggleActor   = useCallback((a: string) => dispatch(toggleActorAction(a)), [dispatch]);
  const togglePriority = useCallback((p: string) => dispatch(togglePriorityAction(p)), [dispatch]);
  const toggleStatus  = useCallback((s: string) => dispatch(toggleStatusAction(s)), [dispatch]);
  const toggleHeat    = useCallback(() => dispatch(toggleHeatAction()), [dispatch]);
  const setTimeRange  = useCallback((r: [number, number] | null) => dispatch(setTimeRangeAction(r)), [dispatch]);
  const resetFilters  = useCallback(() => dispatch(resetFiltersAction()), [dispatch]);

  return {
    state: filterState,
    filtered,
    facets,
    actorMeta,
    rawData,
    dataExtent,
    viewExtent,
    setViewExtent,
    toggleDataset,
    toggleType,
    toggleActor,
    togglePriority,
    toggleStatus,
    toggleHeat,
    setTimeRange,
    resetFilters,
    isFiltered,
    isLoading,
  };
}
