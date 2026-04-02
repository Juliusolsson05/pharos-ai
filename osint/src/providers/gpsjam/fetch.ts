const FETCH_TIMEOUT = 30_000;

export type GpsJamHex = {
  h3: string;
  lat: number;
  lon: number;
  level: 'low' | 'medium' | 'high';
  region: string;
};

/**
 * Fetch GPS interference data from Wingbits API.
 * Free API key required.
 */
export async function fetchGpsJam(apiKey: string): Promise<GpsJamHex[]> {
  if (!apiKey) throw new Error('WINGBITS_API_KEY must be set');

  const res = await fetch('https://customer-api.wingbits.com/v1/gps/jam', {
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) throw new Error(`Wingbits API ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = (await res.json()) as { hexes?: Array<Record<string, unknown>> };
  if (!Array.isArray(data.hexes)) return [];

  return data.hexes
    .filter((h) => {
      const lat = Number(h.lat);
      const lon = Number(h.lon);
      return isFinite(lat) && isFinite(lon);
    })
    .map((h) => ({
      h3: String(h.h3 || ''),
      lat: Number(h.lat),
      lon: Number(h.lon),
      level: (String(h.level || 'low')) as GpsJamHex['level'],
      region: String(h.region || ''),
    }));
}
