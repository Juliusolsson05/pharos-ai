import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { PRESETS, type Column, type PresetId, type WidgetKey } from './presets';

// ─── State ──────────────────────────────────────────────────────────────────

export interface WorkspaceState {
  columns: Column[];
  activePreset: PresetId | 'custom';
  editing: boolean;
  /** Column panel sizes: { [panelId]: percentage } */
  columnSizes: Record<string, number>;
  /** Row panel sizes per column: { [colId]: { [panelId]: percentage } } */
  rowSizes: Record<string, Record<string, number>>;
}

function newColId() {
  return `col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const initialState: WorkspaceState = {
  columns: PRESETS.analyst.columns,
  activePreset: 'analyst',
  editing: false,
  columnSizes: { ...PRESETS.analyst.columnSizes },
  rowSizes: {},
};

// ─── Slice ──────────────────────────────────────────────────────────────────

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    applyPreset(state, action: PayloadAction<PresetId>) {
      const preset = PRESETS[action.payload];
      state.columns = preset.columns;
      state.activePreset = action.payload;
      state.columnSizes = { ...preset.columnSizes };
      state.rowSizes = {};
    },

    setColumns(state, action: PayloadAction<Column[]>) {
      state.columns = action.payload;
      state.activePreset = 'custom';
      state.columnSizes = {};
      state.rowSizes = {};
    },

    addWidget(state, action: PayloadAction<{ colId: string; widget: WidgetKey }>) {
      const col = state.columns.find(c => c.id === action.payload.colId);
      if (col) col.widgets.push(action.payload.widget);
      state.activePreset = 'custom';
      // Clear row sizes for the affected column (new widget added)
      delete state.rowSizes[action.payload.colId];
    },

    removeWidget(state, action: PayloadAction<{ colId: string; widget: WidgetKey }>) {
      const col = state.columns.find(c => c.id === action.payload.colId);
      if (col) {
        col.widgets = col.widgets.filter(w => w !== action.payload.widget);
      }
      state.columns = state.columns.filter(c => c.widgets.length > 0);
      state.activePreset = 'custom';
      // Clear all sizes — column count may have changed
      state.columnSizes = {};
      state.rowSizes = {};
    },

    moveWidget(state, action: PayloadAction<{ colId: string; widget: WidgetKey; direction: 'left' | 'right' }>) {
      const { colId, widget, direction } = action.payload;
      const ci = state.columns.findIndex(c => c.id === colId);
      const targetIndex = direction === 'left' ? ci - 1 : ci + 1;
      if (targetIndex < 0 || targetIndex >= state.columns.length) return;

      const srcCol = state.columns[ci];
      const dstCol = state.columns[targetIndex];
      srcCol.widgets = srcCol.widgets.filter(w => w !== widget);
      dstCol.widgets.push(widget);
      state.columns = state.columns.filter(c => c.widgets.length > 0);
      state.activePreset = 'custom';
      state.columnSizes = {};
      state.rowSizes = {};
    },

    addColumn(state, action: PayloadAction<WidgetKey>) {
      state.columns.push({ id: newColId(), widgets: [action.payload] });
      state.activePreset = 'custom';
      state.columnSizes = {};
      state.rowSizes = {};
    },

    toggleEditing(state) {
      state.editing = !state.editing;
    },

    resetToPreset(state) {
      const preset = PRESETS.analyst;
      state.columns = preset.columns;
      state.activePreset = 'analyst';
      state.columnSizes = { ...preset.columnSizes };
      state.rowSizes = {};
    },

    setColumnSizes(state, action: PayloadAction<Record<string, number>>) {
      state.columnSizes = action.payload;
    },

    setRowSizes(state, action: PayloadAction<{ colId: string; layout: Record<string, number> }>) {
      state.rowSizes[action.payload.colId] = action.payload.layout;
    },
  },
});

export const {
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
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
