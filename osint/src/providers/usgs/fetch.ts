const USGS_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
const FETCH_TIMEOUT = 15_000;

export type UsgsQuake = {
  id: string;
  place: string;
  magnitude: number;
  depthKm: number;
  lat: number;
  lon: number;
  occurredAt: number;
  sourceUrl: string;
};

export async function fetchQuakes(): Promise<UsgsQuake[]> {
  const res = await fetch(USGS_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) throw new Error(`USGS API ${res.status}`);

  const geojson = (await res.json()) as {
    features: Array<{
      id: string;
      properties: { place: string; mag: number; time: number; url: string };
      geometry: { coordinates: [number, number, number] };
    }>;
  };

  return geojson.features
    .filter((f) => f.geometry?.coordinates && f.properties)
    .map((f) => ({
      id: f.id,
      place: f.properties.place || '',
      magnitude: f.properties.mag ?? 0,
      depthKm: f.geometry.coordinates[2] ?? 0,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      occurredAt: f.properties.time ?? 0,
      sourceUrl: f.properties.url || '',
    }));
}
