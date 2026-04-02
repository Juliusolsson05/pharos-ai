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

// Bounding box for cables crossing our region of interest
const ME_BOUNDS = { south: 5, north: 45, west: 20, east: 70 };

function coordsInRegion(coords: number[][]): boolean {
  return coords.some(
    ([lon, lat]) =>
      lat >= ME_BOUNDS.south && lat <= ME_BOUNDS.north &&
      lon >= ME_BOUNDS.west && lon <= ME_BOUNDS.east,
  );
}

/**
 * Fetch submarine cable routes that pass through the Middle East region.
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

  return geojson.features
    .filter((f) => {
      // Check if any segment of the cable passes through our region
      const coords = f.geometry.coordinates;
      return coords.some((segment) => coordsInRegion(segment));
    })
    .map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      color: f.properties.color,
      coordinates: f.geometry.coordinates as [number, number][][],
    }));
}

/**
 * Fetch landing points in the Middle East region.
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

  return geojson.features
    .filter((f) => {
      const [lon, lat] = f.geometry.coordinates;
      return lat >= ME_BOUNDS.south && lat <= ME_BOUNDS.north &&
             lon >= ME_BOUNDS.west && lon <= ME_BOUNDS.east;
    })
    .map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    }));
}
