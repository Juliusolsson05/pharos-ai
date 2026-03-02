import { useState, useMemo, useCallback } from 'react';

import { STRIKE_ARCS, MISSILE_TRACKS, TARGETS, ALLIED_ASSETS, THREAT_ZONES, HEAT_POINTS } from '@/data/mapData';
import { ACTOR_META } from '@/data/mapTokens';

import { extractInitialState, applyFilters, extractTimeExtent } from '@/lib/map-filter-engine';

import type { FilterState, FilteredData, FilterFacets, DataArrays } from '@/lib/map-filter-engine';

// ─── Re-exports ─────────────────────────────────────────────────────────────────

export type { FilterState, FilteredData, FilterFacets };

// ─── Static raw data ────────────────────────────────────────────────────────────

const RAW_DATA: DataArrays = {
  strikes:  STRIKE_ARCS,
  missiles: MISSILE_TRACKS,
  targets:  TARGETS,
  assets:   ALLIED_ASSETS,
  zones:    THREAT_ZONES,
  heat:     HEAT_POINTS,
};

// ─── Dataset names (for the top bar) ────────────────────────────────────────────

export type DatasetName = 'strikes' | 'missiles' | 'targets' | 'assets' | 'zones';

export const ALL_DATASETS: DatasetName[] = ['strikes', 'missiles', 'targets', 'assets', 'zones'];

export const DATASET_LABEL: Record<DatasetName, string> = {
  strikes: 'STRIKES', missiles: 'MISSILES', targets: 'TARGETS', assets: 'ASSETS', zones: 'ZONES',
};

// ─── Toggle helper — prevents empty sets ────────────────────────────────────────

function toggle(prev: Set<string>, item: string): Set<string> {
  const next = new Set(prev);
  next.has(item) ? next.delete(item) : next.add(item);
  return next.size === 0 ? prev : next;
}

// ─── Return type ────────────────────────────────────────────────────────────────

export type UseMapFiltersReturn = {
  state:    FilterState;
  filtered: FilteredData;
  facets:   FilterFacets;
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
};

// ─── Hook ───────────────────────────────────────────────────────────────────────

const INITIAL_STATE = extractInitialState(RAW_DATA);
const DATA_EXTENT = extractTimeExtent(RAW_DATA);

export function useMapFilters(): UseMapFiltersReturn {
  const [state, setState] = useState<FilterState>(INITIAL_STATE);
  // Default to 3-day view centered on the action, not the full data extent
  const [viewExtent, setViewExtent] = useState<[number, number]>(() => {
    const span = DATA_EXTENT[1] - DATA_EXTENT[0];
    const threeDays = 3 * 86400_000;
    if (span <= threeDays) return DATA_EXTENT;
    return [Math.max(DATA_EXTENT[0], DATA_EXTENT[1] - threeDays), DATA_EXTENT[1]];
  });

  // When toggling a dataset ON, auto-enable all its types
  const toggleDataset = useCallback((d: string) => setState(p => {
    const next = toggle(p.datasets, d);
    if (next.has(d) && !p.datasets.has(d)) {
      const items = {
        strikes: RAW_DATA.strikes, missiles: RAW_DATA.missiles,
        targets: RAW_DATA.targets, assets: RAW_DATA.assets,
        zones: RAW_DATA.zones,
      }[d] as Array<{ type: string }> | undefined;
      if (items) {
        const types = new Set(p.types);
        for (const item of items) types.add(item.type);
        return { ...p, datasets: next, types };
      }
    }
    return { ...p, datasets: next };
  }), []);

  const toggleType     = useCallback((t: string) => setState(p => ({ ...p, types:      toggle(p.types, t) })), []);
  const toggleActor    = useCallback((a: string) => setState(p => ({ ...p, actors:     toggle(p.actors, a) })), []);
  const togglePriority = useCallback((p: string) => setState(prev => ({ ...prev, priorities: toggle(prev.priorities, p) })), []);
  const toggleStatus   = useCallback((s: string) => setState(p => ({ ...p, statuses:   toggle(p.statuses, s) })), []);
  const toggleHeat     = useCallback(() => setState(p => ({ ...p, heat: !p.heat })), []);
  const setTimeRange   = useCallback((range: [number, number] | null) => setState(p => ({ ...p, timeRange: range })), []);
  const resetFilters   = useCallback(() => setState(INITIAL_STATE), []);

  const { filtered, facets } = useMemo(
    () => applyFilters(RAW_DATA, state, ACTOR_META),
    [state],
  );

  const isFiltered =
    state.datasets.size < INITIAL_STATE.datasets.size ||
    state.types.size < INITIAL_STATE.types.size ||
    state.actors.size < INITIAL_STATE.actors.size ||
    state.priorities.size < INITIAL_STATE.priorities.size ||
    state.statuses.size < INITIAL_STATE.statuses.size ||
    !state.heat ||
    state.timeRange !== null;

  return {
    state, filtered, facets, dataExtent: DATA_EXTENT, viewExtent, setViewExtent,
    toggleDataset, toggleType, toggleActor, togglePriority, toggleStatus, toggleHeat,
    setTimeRange, resetFilters, isFiltered,
  };
}
