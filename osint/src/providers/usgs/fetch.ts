const USGS_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
const FETCH_TIMEOUT = 15_000;

export type UsgsQuake = {
  id: string;
  place: string;
  magnitude: number;
  magType: string;
  depthKm: number;
  lat: number;
  lon: number;
  occurredAt: number;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  tsunami: number | null;
  significance: number | null;
  status: string | null;
  net: string | null;
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
      properties: Record<string, unknown>;
      geometry: { coordinates: [number, number, number] };
    }>;
  };

  return geojson.features
    .filter((f) => f.geometry?.coordinates && f.properties)
    .map((f) => {
      const p = f.properties;
      return {
        id: f.id,
        place: String(p.place || ''),
        magnitude: Number(p.mag ?? 0),
        magType: String(p.magType || ''),
        depthKm: f.geometry.coordinates[2] ?? 0,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        occurredAt: Number(p.time ?? 0),
        felt: p.felt != null ? Number(p.felt) : null,
        cdi: p.cdi != null ? Number(p.cdi) : null,
        mmi: p.mmi != null ? Number(p.mmi) : null,
        alert: p.alert != null ? String(p.alert) : null,
        tsunami: p.tsunami != null ? Number(p.tsunami) : null,
        significance: p.sig != null ? Number(p.sig) : null,
        status: p.status != null ? String(p.status) : null,
        net: p.net != null ? String(p.net) : null,
        sourceUrl: String(p.url || ''),
      };
    });
}
