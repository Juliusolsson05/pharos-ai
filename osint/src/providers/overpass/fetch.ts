const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const FETCH_TIMEOUT = 60_000; // Overpass can be slow

// Middle East bounding box: south,west,north,east
const BBOX = '12,25,42,65';

export type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

const QUERY = `
[out:json][timeout:45];
(
  nwr(${BBOX})[military~"^(base|airfield|naval_base|barracks|range|checkpoint)$"];
  nwr(${BBOX})[aeroway=aerodrome][military];
  nwr(${BBOX})[landuse=military]["name"];
);
out center tags;
`;

/**
 * Fetch military installations from OSM Overpass API.
 * Uses `out center` so ways/relations return a single center point.
 */
export async function fetchOverpass(): Promise<OverpassElement[]> {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(QUERY)}`,
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`Overpass API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = (await res.json()) as { elements: Array<Record<string, unknown>> };

  return json.elements
    .filter((e) => {
      // Must have coordinates (center for ways/relations)
      const lat = (e.lat ?? (e.center as Record<string, number>)?.lat) as number;
      const lon = (e.lon ?? (e.center as Record<string, number>)?.lon) as number;
      return isFinite(lat) && isFinite(lon);
    })
    .map((e) => ({
      type: e.type as OverpassElement['type'],
      id: e.id as number,
      lat: ((e.lat ?? (e.center as Record<string, number>)?.lat) as number),
      lon: ((e.lon ?? (e.center as Record<string, number>)?.lon) as number),
      tags: (e.tags as Record<string, string>) || {},
    }));
}
