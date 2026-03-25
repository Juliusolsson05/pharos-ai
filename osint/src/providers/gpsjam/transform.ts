import type { GpsJamHex } from './fetch.js';
import type { ThreatZone } from '../../types.js';

// Middle East region filter
const REGION_BOUNDS = { south: 5, north: 45, west: 20, east: 70 };

const LEVEL_COLORS: Record<string, [number, number, number, number]> = {
  high: [231, 106, 110, 100],   // danger
  medium: [236, 154, 60, 80],   // warning
  low: [76, 144, 240, 50],      // info
};

/**
 * Convert GPS interference hexes into threat zone point-markers.
 * Each hex becomes a single-point zone (the frontend can cluster).
 */
export function buildThreatZones(hexes: GpsJamHex[]): ThreatZone[] {
  return hexes
    .filter((h) =>
      h.lat >= REGION_BOUNDS.south && h.lat <= REGION_BOUNDS.north &&
      h.lon >= REGION_BOUNDS.west && h.lon <= REGION_BOUNDS.east &&
      (h.level === 'medium' || h.level === 'high'),
    )
    .map((h) => ({
      id: `gpsjam-${h.h3}`,
      sourceEventId: h.h3,
      actor: 'GPS_INTERFERENCE',
      priority: (h.level === 'high' ? 'P1' : 'P2') as ThreatZone['priority'],
      category: 'ZONE' as const,
      type: 'THREAT_CORRIDOR' as const,
      name: `GPS Interference (${h.level}) — ${h.region || 'Unknown'}`,
      coordinates: [[h.lon, h.lat]] as [number, number][],
      color: LEVEL_COLORS[h.level] || LEVEL_COLORS.low,
    }));
}
