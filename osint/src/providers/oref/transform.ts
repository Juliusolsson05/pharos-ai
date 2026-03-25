import type { OrefAlert } from './fetch.js';
import { resolveAreaCoords } from './locations.js';
import type { HeatPoint } from '../../types.js';

/**
 * Convert OREF alerts to heat points at resolved locations.
 * Each affected area in an alert becomes its own heat point.
 */
export function buildHeatPoints(alerts: OrefAlert[]): HeatPoint[] {
  const points: HeatPoint[] = [];

  for (const alert of alerts) {
    for (const area of alert.data) {
      const coords = resolveAreaCoords(area);
      if (!coords) continue;

      points.push({
        id: `oref-${alert.id}-${area}`,
        sourceEventId: alert.id,
        actor: 'OREF',
        priority: alert.cat === '1' ? 'P1' : 'P2', // cat 1 = missiles
        position: coords,
        weight: alert.cat === '1' ? 50 : 20,
      });
    }
  }

  return points;
}
