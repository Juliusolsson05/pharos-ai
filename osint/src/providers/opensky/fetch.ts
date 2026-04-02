const FETCH_TIMEOUT = 30_000;

// Two query regions covering our theater (from World Monitor)
const REGIONS = [
  { name: 'WESTERN', lamin: 13, lamax: 55, lomin: -10, lomax: 57 },
  { name: 'PACIFIC', lamin: 10, lamax: 46, lomin: 57, lomax: 80 },
];

export type OpenskyState = {
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  velocity: number;
  heading: number;
  onGround: boolean;
  lastContact: number;
};

/**
 * Fetch all aircraft states from OpenSky for our regions.
 * Free API, no auth required locally. Rate limit: ~10 req/min anonymous.
 */
export async function fetchOpenskyStates(): Promise<OpenskyState[]> {
  const all: OpenskyState[] = [];
  const seen = new Set<string>();

  for (const region of REGIONS) {
    const url = `https://opensky-network.org/api/states/all?lamin=${region.lamin}&lomin=${region.lomin}&lamax=${region.lamax}&lomax=${region.lomax}`;

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });

      if (!res.ok) {
        // 429 or other error — skip this region
        continue;
      }

      const data = (await res.json()) as { states: (string | number | boolean | null)[][] | null };
      if (!data.states) continue;

      for (const s of data.states) {
        const icao24 = String(s[0] || '').toLowerCase();
        if (seen.has(icao24)) continue;
        seen.add(icao24);

        const lat = s[6] as number | null;
        const lon = s[5] as number | null;
        if (lat == null || lon == null) continue;

        all.push({
          icao24,
          callsign: String(s[1] || '').trim(),
          lat,
          lon,
          altitude: (s[7] as number) ?? 0,
          velocity: (s[9] as number) ?? 0,
          heading: (s[10] as number) ?? 0,
          onGround: (s[8] as boolean) ?? false,
          lastContact: (s[4] as number) ?? 0,
        });
      }
    } catch {
      // Skip region on failure
    }
  }

  return all;
}
