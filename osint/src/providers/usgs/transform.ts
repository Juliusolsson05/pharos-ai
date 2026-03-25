import type { UsgsQuake } from './fetch.js';
import type { HeatPoint } from '../../types.js';

// Only keep quakes in or near our region of interest
const REGION_BOUNDS = { south: 5, north: 45, west: 20, east: 70 };

export function buildHeatPoints(quakes: UsgsQuake[]): HeatPoint[] {
  return quakes
    .filter((q) =>
      q.lat >= REGION_BOUNDS.south && q.lat <= REGION_BOUNDS.north &&
      q.lon >= REGION_BOUNDS.west && q.lon <= REGION_BOUNDS.east,
    )
    .map((q) => ({
      id: `usgs-${q.id}`,
      sourceEventId: q.id,
      actor: 'SEISMIC',
      priority: q.magnitude >= 6 ? 'P1' : q.magnitude >= 5 ? 'P2' : 'P3',
      position: [q.lon, q.lat] as [number, number],
      weight: Math.round(Math.pow(10, q.magnitude - 4) * 10), // exponential scaling
    }));
}
