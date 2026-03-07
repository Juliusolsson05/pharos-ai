import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { extractInitialState } from '@/features/map/lib/map-filter-engine';
import type { MapViewState } from '@deck.gl/core';
import type { MapStory } from '@/types/domain';
import type { SelectedItem } from '@/features/map/components/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SerializableFilterState = {
  datasets:   string[];
  types:      string[];
  actors:     string[];
  statuses:   string[];
  priorities: string[];
  heat:       boolean;
  timeRange:  [number, number] | null;
};

export type MapState = {
  // Camera
  viewState: MapViewState;

  // Filter
  filters: SerializableFilterState;
  initialFilters: SerializableFilterState;
  dataExtent: [number, number];
  viewExtent: [number, number];

  // Interaction
  activeStory: MapStory | null;
  selectedItem: SelectedItem | null;

  // UI chrome
  sidebarOpen: boolean;
  mapStyle: 'dark' | 'satellite';

  // Guard: whether initializeFilters has run
  _filtersFingerprint: string | null;
};

// ─── localStorage persistence ────────────────────────────────────────────────

const MAP_STORAGE_KEY = 'pharos:map:v1';

type PersistedMapPrefs = {
  sidebarOpen: boolean;
  mapStyle: 'dark' | 'satellite';
};

function loadPersistedMapPrefs(): Partial<PersistedMapPrefs> | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(MAP_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedMapPrefs;
  } catch { /* corrupt data */ }
  return undefined;
}

export function persistMapPrefs(state: MapState): void {
  if (typeof window === 'undefined') return;
  try {
    const persisted: PersistedMapPrefs = {
      sidebarOpen: state.sidebarOpen,
      mapStyle:    state.mapStyle,
    };
    localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(persisted));
  } catch { /* quota exceeded */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Convert Set-based initial state to serializable arrays
export function toSerializable(fs: ReturnType<typeof extractInitialState>): SerializableFilterState {
  return {
    datasets:   [...fs.datasets],
    types:      [...fs.types],
    actors:     [...fs.actors],
    statuses:   [...fs.statuses],
    priorities: [...fs.priorities],
    heat:       fs.heat,
    timeRange:  fs.timeRange,
  };
}

// Toggle helper — prevents empty arrays
function toggleArr(arr: string[], item: string): string[] {
  const has = arr.includes(item);
  const next = has ? arr.filter(x => x !== item) : [...arr, item];
  return next.length === 0 ? arr : next;
}

// ─── Empty defaults ──────────────────────────────────────────────────────────

const EMPTY_FILTERS: SerializableFilterState = {
  datasets: [], types: [], actors: [], statuses: [], priorities: [],
  heat: true, timeRange: null,
};

// ─── Initial state ───────────────────────────────────────────────────────────

const INITIAL_VIEW: MapViewState = { longitude: 51.0, latitude: 30.0, zoom: 4.5, pitch: 0, bearing: 0 };

function buildInitialState(): MapState {
  const persisted = loadPersistedMapPrefs();
  return {
    viewState:      INITIAL_VIEW,
    filters:        EMPTY_FILTERS,
    initialFilters: EMPTY_FILTERS,
    dataExtent:     [0, 0],
    viewExtent:     [0, 0],
    activeStory:  null,
    selectedItem: null,
    sidebarOpen: persisted?.sidebarOpen ?? true,
    mapStyle:    persisted?.mapStyle    ?? 'dark',
    _filtersFingerprint: null,
  };
}

const initialState: MapState = buildInitialState();

// ─── Slice ───────────────────────────────────────────────────────────────────

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    // Camera
    setViewState(state, action: PayloadAction<MapViewState>) {
      state.viewState = action.payload;
    },

    // Initialize filters from fetched data (idempotent per data fingerprint)
    initializeFilters(state, action: PayloadAction<{ initialFilters: SerializableFilterState; dataExtent: [number, number]; fingerprint: string }>) {
      const { initialFilters, dataExtent, fingerprint } = action.payload;
      if (state._filtersFingerprint === fingerprint) return;
      state._filtersFingerprint = fingerprint;
      state.initialFilters = initialFilters;
      state.dataExtent = dataExtent;

      // Compute view extent (last 3 days or full span)
      const span      = dataExtent[1] - dataExtent[0];
      const threeDays = 3 * 86400_000;
      state.viewExtent = span <= threeDays
        ? dataExtent
        : [Math.max(dataExtent[0], dataExtent[1] - threeDays), dataExtent[1]];

      // Always initialize filters from data (no localStorage persistence for filters)
      state.filters = initialFilters;

      // Default timeRange to last 24 hours of data
      const oneDay = 86400_000;
      state.filters.timeRange = [Math.max(dataExtent[0], dataExtent[1] - oneDay), dataExtent[1]];
    },

    // Filters
    toggleDataset(state, action: PayloadAction<{ dataset: string; datasetTypes?: string[] }>) {
      const { dataset: d, datasetTypes } = action.payload;
      const next = toggleArr(state.filters.datasets, d);
      // When toggling a dataset ON, auto-enable all its types
      if (next.includes(d) && !state.filters.datasets.includes(d) && datasetTypes) {
        const types = new Set(state.filters.types);
        for (const t of datasetTypes) types.add(t);
        state.filters.types = [...types];
      }
      state.filters.datasets = next;
    },
    toggleType(state, action: PayloadAction<string>) {
      state.filters.types = toggleArr(state.filters.types, action.payload);
    },
    toggleActor(state, action: PayloadAction<string>) {
      state.filters.actors = toggleArr(state.filters.actors, action.payload);
    },
    togglePriority(state, action: PayloadAction<string>) {
      state.filters.priorities = toggleArr(state.filters.priorities, action.payload);
    },
    toggleStatus(state, action: PayloadAction<string>) {
      state.filters.statuses = toggleArr(state.filters.statuses, action.payload);
    },
    toggleHeat(state) {
      state.filters.heat = !state.filters.heat;
    },
    setTimeRange(state, action: PayloadAction<[number, number] | null>) {
      state.filters.timeRange = action.payload;
    },
    setViewExtent(state, action: PayloadAction<[number, number]>) {
      state.viewExtent = action.payload;
    },
    resetFilters(state) {
      state.filters = state.initialFilters;
    },

    // Interaction
    setActiveStory(state, action: PayloadAction<MapStory | null>) {
      state.activeStory = action.payload;
    },
    activateStory(state, action: PayloadAction<MapStory>) {
      const story = action.payload;
      state.activeStory = story;
      state.sidebarOpen = true;
      state.selectedItem = null;
      state.viewState = {
        ...state.viewState,
        ...story.viewState,
        transitionDuration: 1200,
      };

      // Auto-fit timeline to story's events
      const timestamps = [
        new Date(story.timestamp).getTime(),
        ...story.events.map(e => new Date(e.time).getTime()),
      ].filter(t => !isNaN(t));

      if (timestamps.length > 0) {
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        const span = max - min;
        const twoHours = 2 * 60 * 60 * 1000;
        const margin = Math.max(twoHours, span * 0.1);

        // Selection = story events with margin
        const selMin = min - margin;
        const selMax = max + margin;

        // View = 7-day window centered on the story's midpoint
        const sevenDays = 7 * 86400_000;
        const mid = (min + max) / 2;
        let vMin = mid - sevenDays / 2;
        let vMax = mid + sevenDays / 2;

        // Clamp view to dataExtent if populated
        const hasExtent = state.dataExtent[0] !== 0 || state.dataExtent[1] !== 0;
        if (hasExtent) {
          vMin = Math.max(state.dataExtent[0], vMin);
          vMax = Math.min(state.dataExtent[1], vMax);
        }

        state.viewExtent = [vMin, vMax];
        state.filters.timeRange = [selMin, selMax];
      }
    },
    setSelectedItem(state, action: PayloadAction<SelectedItem | null>) {
      state.selectedItem = action.payload;
    },

    // UI chrome
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setMapStyle(state, action: PayloadAction<'dark' | 'satellite'>) {
      state.mapStyle = action.payload;
    },
  },
});

export const {
  setViewState,
  initializeFilters,
  toggleDataset,
  toggleType,
  toggleActor,
  togglePriority,
  toggleStatus,
  toggleHeat,
  setTimeRange,
  setViewExtent,
  resetFilters,
  setActiveStory,
  activateStory,
  setSelectedItem,
  toggleSidebar,
  setSidebarOpen,
  setMapStyle,
} = mapSlice.actions;

export default mapSlice.reducer;
