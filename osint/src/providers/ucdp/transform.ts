import type { UcdpEvent } from './fetch.js';
import type { HeatPoint } from '../../types.js';

// Middle East region filter
const REGION_BOUNDS = { south: 5, north: 45, west: 20, east: 70 };

export function buildHeatPoints(events: UcdpEvent[]): HeatPoint[] {
  return events
    .filter((e) =>
      e.lat >= REGION_BOUNDS.south && e.lat <= REGION_BOUNDS.north &&
      e.lon >= REGION_BOUNDS.west && e.lon <= REGION_BOUNDS.east,
    )
    .map((e) => ({
      id: `ucdp-${e.id}`,
      sourceEventId: e.id,
      actor: e.sideA || 'Unknown',
      priority: e.deathsBest >= 25 ? 'P1' : e.deathsBest >= 5 ? 'P2' : 'P3',
      position: [e.lon, e.lat] as [number, number],
      weight: Math.max(1, e.deathsBest),
    }));
}

// UCDP state-based events with fatalities → strikes
export function buildStrikes(events: UcdpEvent[]) {
  return events
    .filter((e) =>
      e.type === 1 && e.deathsBest > 0 &&
      e.lat >= REGION_BOUNDS.south && e.lat <= REGION_BOUNDS.north &&
      e.lon >= REGION_BOUNDS.west && e.lon <= REGION_BOUNDS.east,
    )
    .map((e) => ({
      id: `ucdp-strike-${e.id}`,
      sourceEventId: e.id,
      actor: e.sideA,
      priority: (e.deathsBest >= 25 ? 'P1' : e.deathsBest >= 5 ? 'P2' : 'P3') as 'P1' | 'P2' | 'P3',
      type: 'AIRSTRIKE' as const,
      timestamp: e.dateStart ? new Date(e.dateStart).toISOString() : '',
      position: [e.lon, e.lat] as [number, number],
      label: `${e.sideA} vs ${e.sideB} — ${e.country}`,
      severity: (e.deathsBest >= 25 ? 'CRITICAL' : 'HIGH') as 'CRITICAL' | 'HIGH',
    }));
}
