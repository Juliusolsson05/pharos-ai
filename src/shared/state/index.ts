import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook,useDispatch, useSelector } from 'react-redux';

import type { Column } from '@/features/dashboard/state/presets';
import workspaceReducer, {
  addColumn,
  addWidget,
  applyPreset,
  moveWidget,
  removeWidget,
  resetToPreset,
  setColumns,
  setColumnSizes,
  setRowSizes,
  toggleEditing,
  type WorkspaceState,
} from '@/features/dashboard/state/workspace-slice';
import mapReducer, {
  persistMapPrefs,
  resetFilters,
  setMapStyle,
  setTimeRange,
  toggleActor,
  toggleDataset,
  toggleHeat,
  togglePriority,
  toggleSidebar,
  toggleStatus,
  toggleType,
} from '@/features/map/state/map-slice';

import { hasPreferencesConsent } from '@/shared/lib/analytics/consent';

// localStorage persistence

const STORAGE_KEY_V4 = 'pharos:workspace:v4';
const STORAGE_KEY_V3 = 'pharos:workspace:v3';

function loadPersistedState(): { workspace: WorkspaceState } | undefined {
  if (typeof window === 'undefined') return undefined;
  if (!hasPreferencesConsent()) return undefined;
  try {
    const v4 = localStorage.getItem(STORAGE_KEY_V4);
    if (v4) {
      const parsed = JSON.parse(v4) as Partial<WorkspaceState> & Pick<WorkspaceState, 'columns' | 'activePreset' | 'editing'>;
      return {
        workspace: {
          ...parsed,
          columnSizes: parsed.columnSizes ?? {},
          rowSizes: parsed.rowSizes ?? {},
        },
      };
    }

    // Migrate from v3
    const v3 = localStorage.getItem(STORAGE_KEY_V3);
    if (v3) {
      const parsed = JSON.parse(v3) as { columns: Column[] };
      const migrated: WorkspaceState = {
        columns: parsed.columns,
        activePreset: 'custom',
        editing: false,
        columnSizes: {},
        rowSizes: {},
      };
      return { workspace: migrated };
    }
  } catch { /* corrupt data — fall through to defaults */ }
  return undefined;
}

const listenerMiddleware = createListenerMiddleware();

// Persist workspace state
listenerMiddleware.startListening({
  matcher: isAnyOf(
    applyPreset,
    setColumns,
    addWidget,
    removeWidget,
    moveWidget,
    addColumn,
    toggleEditing,
    resetToPreset,
    setColumnSizes,
    setRowSizes,
  ),
  effect: (_action, listenerApi) => {
    if (typeof window === 'undefined') return;
    if (!hasPreferencesConsent()) return;
    try {
      const state = listenerApi.getState() as RootState;
      localStorage.setItem(STORAGE_KEY_V4, JSON.stringify(state.workspace));
    } catch { /* quota exceeded, etc */ }
  },
});

// Persist map UI preferences (filters, sidebarOpen, mapStyle)
listenerMiddleware.startListening({
  matcher: isAnyOf(
    toggleDataset,
    toggleType,
    toggleActor,
    togglePriority,
    toggleStatus,
    toggleHeat,
    setTimeRange,
    resetFilters,
    toggleSidebar,
    setMapStyle,
  ),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    persistMapPrefs(state.map);
  },
});

// Store

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    map: mapReducer,
  },
  preloadedState: loadPersistedState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['map.viewState', 'map.activeStory', 'map.selectedItem'],
        ignoredActions: ['map/setViewState', 'map/activateStory', 'map/setActiveStory', 'map/setSelectedItem'],
      },
    }).prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;
