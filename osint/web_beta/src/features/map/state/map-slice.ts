import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type LayerState = {
  reference: boolean;
  gdelt: boolean;
  firms: boolean;
  usgs: boolean;
  opensky: boolean;
  eonet: boolean;
  overpass: boolean;
  ports: boolean;
  ais: boolean;
};

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

type SelectedItem = { layer: string; object: Record<string, unknown> } | null;

type MapState = {
  viewState: ViewState;
  layers: LayerState;
  showNightlights: boolean;
  selected: SelectedItem;
};

const initialState: MapState = {
  viewState: { longitude: 47, latitude: 30, zoom: 4.5, pitch: 0, bearing: 0 },
  layers: {
    reference: true, gdelt: true, firms: true, usgs: true, opensky: true,
    eonet: true, overpass: false, ports: false, ais: true,
  },
  showNightlights: true,
  selected: null,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setViewState(state, action: PayloadAction<ViewState>) {
      state.viewState = action.payload;
    },
    toggleLayer(state, action: PayloadAction<keyof LayerState>) {
      state.layers[action.payload] = !state.layers[action.payload];
    },
    toggleNightlights(state) {
      state.showNightlights = !state.showNightlights;
    },
    setSelected(state, action: PayloadAction<SelectedItem>) {
      state.selected = action.payload;
    },
  },
});

export const { setViewState, toggleLayer, toggleNightlights, setSelected } = mapSlice.actions;
export const mapReducer = mapSlice.reducer;
export type { LayerState, ViewState, SelectedItem };
