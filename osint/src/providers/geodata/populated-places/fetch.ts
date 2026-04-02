import shpjs from 'shpjs';

const NAT_EARTH_URL = 'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_populated_places_simple.zip';
const FETCH_TIMEOUT = 60_000;

export const NAT_EARTH_VERSION = '10m-v5';

export async function downloadPopulatedPlaces(): Promise<{ geojson: GeoJSON.FeatureCollection; rawZip: Buffer }> {
  console.log('[populated-places] Downloading Natural Earth populated places...');
  const res = await fetch(NAT_EARTH_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`Natural Earth download failed: ${res.status}`);

  const rawZip = Buffer.from(await res.arrayBuffer());
  console.log(`[populated-places] Downloaded (${(rawZip.length / 1024 / 1024).toFixed(1)} MB)`);

  const result = await shpjs(rawZip);
  const geojson: GeoJSON.FeatureCollection = Array.isArray(result)
    ? { type: 'FeatureCollection', features: result.flatMap((fc) => (fc as GeoJSON.FeatureCollection).features || []) }
    : result as GeoJSON.FeatureCollection;

  console.log(`[populated-places] Parsed ${geojson.features.length} places`);
  return { geojson, rawZip };
}
