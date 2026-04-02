import type { OpenskyState } from './fetch.js';
import { identifyMilitary } from './military-hex.js';
import type { Asset } from '../../types.js';

export type MilitaryFlight = {
  id: string;
  icao24: string;
  callsign: string;
  operator: string;
  country: string;
  lat: number;
  lon: number;
  altitude: number;
  velocity: number;
  heading: number;
};

export function filterMilitaryFlights(states: OpenskyState[]): MilitaryFlight[] {
  const flights: MilitaryFlight[] = [];

  for (const s of states) {
    if (s.onGround) continue;
    const match = identifyMilitary(s.icao24, s.callsign);
    if (!match) continue;

    flights.push({
      id: `opensky-${s.icao24}`,
      icao24: s.icao24,
      callsign: s.callsign,
      operator: match.operator,
      country: match.country,
      lat: s.lat,
      lon: s.lon,
      altitude: s.altitude,
      velocity: s.velocity,
      heading: s.heading,
    });
  }

  return flights;
}

export function buildAssets(flights: MilitaryFlight[]): Asset[] {
  return flights.map((f) => ({
    id: f.id,
    sourceEventId: f.id,
    actor: f.country,
    priority: 'P2' as const,
    category: 'INSTALLATION' as const,
    // The shared map contract has no aircraft asset type yet, so airborne military
    // sightings are projected into AIR_BASE to stay compatible with the existing UI.
    type: 'AIR_BASE' as const,
    status: 'ACTIVE' as const,
    name: `${f.callsign || f.icao24} (${f.operator.toUpperCase()})`,
    position: [f.lon, f.lat] as [number, number],
    description: `Alt: ${Math.round(f.altitude)}m | ${Math.round(f.velocity * 3.6)}km/h | Hdg: ${Math.round(f.heading)}°`,
  }));
}
