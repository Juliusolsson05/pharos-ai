import AdmZip from 'adm-zip';
import shpjs from 'shpjs';

const GSHHG_URL = 'https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip';
const FETCH_TIMEOUT = 180_000;

export const GSHHG_VERSION = '2.3.7';

export async function downloadGshhg(): Promise<{ geojson: GeoJSON.FeatureCollection; rawZip: Buffer }> {
  console.log('[coastlines] Downloading GSHHG (135 MB)...');
  const res = await fetch(GSHHG_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`GSHHG download failed: ${res.status}`);

  const rawZip = Buffer.from(await res.arrayBuffer());
  console.log(`[coastlines] Downloaded (${(rawZip.length / 1024 / 1024).toFixed(0)} MB)`);

  // Extract intermediate L1 shapefile from the full ZIP
  const fullZip = new AdmZip(rawZip);
  const miniZip = new AdmZip();

  const prefix = 'GSHHS_shp/i/GSHHS_i_L1';
  for (const entry of fullZip.getEntries()) {
    if (entry.entryName.startsWith(prefix)) {
      miniZip.addFile(entry.entryName.split('/').pop()!, entry.getData());
    }
  }

  const miniBuffer = miniZip.toBuffer();
  console.log(`[coastlines] Extracted L1 intermediate (${(miniBuffer.length / 1024 / 1024).toFixed(1)} MB)`);

  const result = await shpjs(miniBuffer);
  const geojson: GeoJSON.FeatureCollection = Array.isArray(result)
    ? { type: 'FeatureCollection', features: result.flatMap((fc) => (fc as GeoJSON.FeatureCollection).features || []) }
    : result as GeoJSON.FeatureCollection;

  console.log(`[coastlines] Parsed ${geojson.features.length} polygons`);
  return { geojson, rawZip };
}
