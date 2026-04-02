'use client';

import { useAppDispatch, useAppSelector } from '@/features/map/state/hooks';
import { toggleLayer, toggleNightlights } from '@/features/map/state/map-slice';
import type { LayerState } from '@/features/map/state/map-slice';

const LAYER_KEYS: (keyof LayerState)[] = [
  'reference', 'gdelt', 'firms', 'eonet', 'usgs', 'opensky', 'overpass', 'ports', 'ais',
];

export function MapControls() {
  const dispatch = useAppDispatch();
  const enabled = useAppSelector((s) => s.map.layers);
  const showNightlights = useAppSelector((s) => s.map.showNightlights);

  return (
    <>
      {LAYER_KEYS.map((key) => (
        <button
          key={key}
          className={enabled[key] ? 'toggle is-on' : 'toggle'}
          onClick={() => dispatch(toggleLayer(key))}
        >
          {key.toUpperCase()}
        </button>
      ))}
      <button
        className={showNightlights ? 'toggle is-on' : 'toggle'}
        onClick={() => dispatch(toggleNightlights())}
        style={{ marginTop: 12 }}
      >
        NIGHTLIGHTS
      </button>
    </>
  );
}
