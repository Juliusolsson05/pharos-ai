import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { STRIKE_ARCS, MISSILE_TRACKS, TARGETS, ALLIED_ASSETS, THREAT_ZONES, HEAT_POINTS } from '@/data/mapData';
import { extractInitialState, extractTimeExtent } from '@/lib/map-filter-engine';
import type { DataArrays } from '@/lib/map-filter-engine';
import type { MapViewState } from '@deck.gl/core';
import type { MapStory } from '@/data/mapStories';
import type { SelectedItem } from '@/components/map/MapDetailPanel';

// ─── Static raw data (same as previously in use-map-filters) ─────────────────

export const RAW_DATA: DataArrays = {
  strikes:  STRIKE_ARCS,
  missiles: MISSILE_TRACKS,
  targets:  TARGETS,
  assets:   ALLIED_ASSETS,
  zones:    THREAT_ZONES,
  heat:     HEAT_POINTS,
};

// ─── Compute initial values from data ────────────────────────────────────────

const INITIAL_FILTER_STATE = extractInitialState(RAW_DATA);
export const DATA_EXTENT = extractTimeExtent(RAW_DATA);

function computeInitialViewExtent(): [number, number] {
  const span = DATA_EXTENT[1] - DATA_EXTENT[0];
  const threeDays = 3 * 86400_000;
  if (span <= threeDays) return DATA_EXTENT;
  return [Math.max(DATA_EXTENT[0], DATA_EXTENT[1] - threeDays), DATA_EXTENT[1]];
}

// Convert Set-based initial state to serializable arrays
function toSerializable(fs: ReturnType<typeof extractInitialState>): SerializableFilterState {
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

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SerializableFilterState {
  datasets:   string[];
  types:      string[];
  actors:     string[];
  statuses:   string[];
  priorities: string[];
  heat:       boolean;
  timeRange:  [number, number] | null;
}

export interface MapState {
  // Camera
  viewState: MapViewState;

  // Filter
  filters: SerializableFilterState;
  viewExtent: [number, number];

  // Interaction
  activeStory: MapStory | null;
  selectedItem: SelectedItem | null;

  // UI chrome
  sidebarOpen: boolean;
  mapStyle: 'dark' | 'satellite';
}

// ─── localStorage persistence ────────────────────────────────────────────────

const MAP_STORAGE_KEY = 'pharos:map:v1';

type PersistedMapPrefs = {
  filters: SerializableFilterState;
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
      filters:     state.filters,
      sidebarOpen: state.sidebarOpen,
      mapStyle:    state.mapStyle,
    };
    localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(persisted));
  } catch { /* quota exceeded */ }
}

// ─── Initial state ───────────────────────────────────────────────────────────

const INITIAL_VIEW: MapViewState = { longitude: 51.0, latitude: 30.0, zoom: 4.5, pitch: 0, bearing: 0 };

export const INITIAL_SERIALIZABLE_FILTERS = toSerializable(INITIAL_FILTER_STATE);

function buildInitialState(): MapState {
  const defaults: MapState = {
    viewState:    INITIAL_VIEW,
    filters:      INITIAL_SERIALIZABLE_FILTERS,
    viewExtent:   computeInitialViewExtent(),
    activeStory:  null,
    selectedItem: null,
    sidebarOpen:  true,
    mapStyle:     'dark',
  };

  const persisted = loadPersistedMapPrefs();
  if (!persisted) return defaults;

  return {
    ...defaults,
    filters:     persisted.filters     ?? defaults.filters,
    sidebarOpen: persisted.sidebarOpen ?? defaults.sidebarOpen,
    mapStyle:    persisted.mapStyle    ?? defaults.mapStyle,
  };
}

const initialState: MapState = buildInitialState();

// ─── Toggle helper — prevents empty arrays ───────────────────────────────────

function toggleArr(arr: string[], item: string): string[] {
  const has = arr.includes(item);
  const next = has ? arr.filter(x => x !== item) : [...arr, item];
  return next.length === 0 ? arr : next;
}

// ─── Slice ───────────────────────────────────────────────────────────────────

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    // Camera
    setViewState(state, action: PayloadAction<MapViewState>) {
      state.viewState = action.payload;
    },

    // Filters
    toggleDataset(state, action: PayloadAction<string>) {
      const d = action.payload;
      const next = toggleArr(state.filters.datasets, d);
      // When toggling a dataset ON, auto-enable all its types
      if (next.includes(d) && !state.filters.datasets.includes(d)) {
        const items = ({
          strikes:  RAW_DATA.strikes,
          missiles: RAW_DATA.missiles,
          targets:  RAW_DATA.targets,
          assets:   RAW_DATA.assets,
          zones:    RAW_DATA.zones,
        } as Record<string, Array<{ type: string }>>)[d];
        if (items) {
          const types = new Set(state.filters.types);
          for (const item of items) types.add(item.type);
          state.filters.types = [...types];
        }
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
      state.filters = INITIAL_SERIALIZABLE_FILTERS;
    },

    // Interaction
    setActiveStory(state, action: PayloadAction<MapStory | null>) {
      state.activeStory = action.payload;
    },
    activateStory(state, action: PayloadAction<MapStory>) {
      state.activeStory = action.payload;
      state.viewState = {
        ...state.viewState,
        ...action.payload.viewState,
        transitionDuration: 1200,
      };
    },
    setSelectedItem(state, action: PayloadAction<SelectedItem | null>) {
      state.selectedItem = action.payload;
    },

    // UI chrome
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setMapStyle(state, action: PayloadAction<'dark' | 'satellite'>) {
      state.mapStyle = action.payload;
    },
  },
});

export const {
  setViewState,
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
  setMapStyle,
} = mapSlice.actions;

export default mapSlice.reducer;
