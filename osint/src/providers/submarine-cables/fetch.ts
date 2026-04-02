const CABLE_GEO_URL = 'https://www.submarinecablemap.com/api/v3/cable/cable-geo.json';
const LANDING_POINTS_URL = 'https://www.submarinecablemap.com/api/v3/landing-point/landing-point-geo.json';
const FETCH_TIMEOUT = 30_000;

export type CableFeature = {
  id: string;
  name: string;
  color: string;
  coordinates: [number, number][][]; // MultiLineString
};

export type LandingPoint = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

/**
 * Fetch all submarine cable routes globally.
 */
export async function fetchCables(): Promise<CableFeature[]> {
  const res = await fetch(CABLE_GEO_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) throw new Error(`Submarine cable API ${res.status}`);

  const geojson = (await res.json()) as {
    features: Array<{
      properties: { id: string; name: string; color: string };
      geometry: { type: string; coordinates: number[][][] };
    }>;
  };

  return geojson.features.map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    color: f.properties.color,
    coordinates: f.geometry.coordinates as [number, number][][],
  }));
}

/**
 * Fetch all landing points globally.
 */
export async function fetchLandingPoints(): Promise<LandingPoint[]> {
  const res = await fetch(LANDING_POINTS_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) return [];

  const geojson = (await res.json()) as {
    features: Array<{
      properties: { id: string; name: string };
      geometry: { coordinates: [number, number] };
    }>;
  };

  return geojson.features.map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
}
