import type { FirmsRow } from './fetch.js';
import type { HeatPoint } from '../../types.js';

// Confidence values: "l" (low), "n" (nominal), "h" (high) for VIIRS
const MIN_CONFIDENCE = new Set(['n', 'nominal', 'h', 'high']);

/**
 * Filter FIRMS rows to keep only nominal/high confidence detections
 * and transform to heat points.
 */
export function buildHeatPoints(rows: FirmsRow[]): HeatPoint[] {
  return rows
    .filter((r) => {
      const conf = r.confidence.toLowerCase();
      // VIIRS uses l/n/h, MODIS uses 0-100
      if (conf === 'l' || conf === 'low') return false;
      const numeric = parseInt(conf, 10);
      if (!isNaN(numeric) && numeric < 50) return false;
      return true;
    })
    .map((r) => {
      const id = `firms-${r.acqDate}-${r.acqTime}-${r.latitude.toFixed(4)}-${r.longitude.toFixed(4)}`;
      return {
        id,
        sourceEventId: id,
        actor: 'THERMAL',
        priority: r.frp >= 50 ? 'P1' : r.frp >= 10 ? 'P2' : 'P3',
        position: [r.longitude, r.latitude] as [number, number],
        weight: Math.max(1, Math.round(r.frp)),
      };
    });
}
