import { createSelector } from '@reduxjs/toolkit';

import { applyFilters } from '@/lib/map-filter-engine';
import { ACTOR_META } from '@/data/mapTokens';
import { RAW_DATA, INITIAL_SERIALIZABLE_FILTERS } from './map-slice';

import type { RootState } from './index';
import type { FilterState } from '@/lib/map-filter-engine';

// ─── Convert serializable arrays → Set-based FilterState ─────────────────────

const selectSerializableFilters = (state: RootState) => state.map.filters;

export const selectFilterState = createSelector(
  [selectSerializableFilters],
  (f): FilterState => ({
    datasets:   new Set(f.datasets),
    types:      new Set(f.types),
    actors:     new Set(f.actors),
    statuses:   new Set(f.statuses),
    priorities: new Set(f.priorities),
    heat:       f.heat,
    timeRange:  f.timeRange,
  }),
);

// ─── Filtered data — only recomputes when filter state changes ───────────────

export const selectFilteredData = createSelector(
  [selectFilterState],
  (filterState) => applyFilters(RAW_DATA, filterState, ACTOR_META),
);

// ─── Derived boolean: are any filters active? ────────────────────────────────

export const selectIsFiltered = createSelector(
  [selectSerializableFilters],
  (f) =>
    f.datasets.length   < INITIAL_SERIALIZABLE_FILTERS.datasets.length   ||
    f.types.length      < INITIAL_SERIALIZABLE_FILTERS.types.length      ||
    f.actors.length     < INITIAL_SERIALIZABLE_FILTERS.actors.length     ||
    f.priorities.length < INITIAL_SERIALIZABLE_FILTERS.priorities.length ||
    f.statuses.length   < INITIAL_SERIALIZABLE_FILTERS.statuses.length   ||
    !f.heat ||
    f.timeRange !== null,
);
