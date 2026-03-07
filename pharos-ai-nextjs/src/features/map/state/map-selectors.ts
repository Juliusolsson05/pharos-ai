import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/shared/state';
import type { FilterState } from '@/features/map/lib/map-filter-engine';

// ─── Base selectors ──────────────────────────────────────────────────────────

const selectSerializableFilters = (state: RootState) => state.map.filters;
const selectInitialFilters      = (state: RootState) => state.map.initialFilters;

// ─── Convert serializable arrays → Set-based FilterState ─────────────────────

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

// ─── Derived boolean: are any filters active? ────────────────────────────────

export const selectIsFiltered = createSelector(
  [selectSerializableFilters, selectInitialFilters],
  (f, initial) =>
    f.datasets.length   < initial.datasets.length   ||
    f.types.length      < initial.types.length      ||
    f.actors.length     < initial.actors.length     ||
    f.priorities.length < initial.priorities.length ||
    f.statuses.length   < initial.statuses.length   ||
    !f.heat ||
    f.timeRange !== null,
);
