import { createWriteStream, existsSync, statSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const GPKG_URL = 'https://zenodo.org/api/records/15103476/files/OGIM_v2.7.gpkg/content';
const GPKG_FILENAME = 'OGIM_v2.7.gpkg';

// Sentinel values used by OGIM for missing data
const NUM_NULL = -999;
const STR_NULL = 'N/A';
const DATE_NULL = '1900-01-01';

export type OgimFeature = {
  ogimId: number;
  category: string;
  region: string | null;
  country: string;
  stateProvince: string | null;
  onOffshore: string;
  name: string | null;
  facId: string | null;
  facType: string | null;
  facStatus: string | null;
  ogimStatus: string | null;
  operator: string | null;
  installDate: string | null;
  commodity: string | null;
  lat: number;
  lon: number;
  liqCapacityBpd: number | null;
  liqThroughputBpd: number | null;
  gasCapacityMmcfd: number | null;
  gasThroughputMmcfd: number | null;
  numStorageTanks: number | null;
  numComprUnits: number | null;
  siteHp: number | null;
  flareYear: number | null;
  flareTempK: number | null;
  gasFlaredMmcf: number | null;
  flareSegmentType: string | null;
  raw: Record<string, unknown>;
};

export type OgimPipelineFeature = {
  ogimId: number;
  region: string | null;
  country: string;
  stateProvince: string | null;
  onOffshore: string;
  name: string | null;
  facType: string | null;
  ogimStatus: string | null;
  operator: string | null;
  commodity: string | null;
  diameterMm: number | null;
  lengthKm: number;
  material: string | null;
  liqCapacityBpd: number | null;
  gasThroughputMmcfd: number | null;
  gasCapacityMmcfd: number | null;
  geometry: unknown;
  raw: Record<string, unknown>;
};

export type OgimBasinFeature = {
  ogimId: number;
  category: string;
  region: string | null;
  country: string;
  onOffshore: string;
  name: string | null;
  reservoirType: string | null;
  areaKm2: number;
  geometry: unknown;
  raw: Record<string, unknown>;
};

function cleanStr(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s === STR_NULL || s === '' ? null : s;
}

function cleanNum(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  if (isNaN(n) || n === NUM_NULL) return null;
  return n;
}

function cleanInt(val: unknown): number | null {
  const n = cleanNum(val);
  return n != null ? Math.round(n) : null;
}

function cleanDate(val: unknown): string | null {
  const s = cleanStr(val);
  return s === DATE_NULL ? null : s;
}

/**
 * Download the OGIM GeoPackage to a temp directory.
 * Streams to disk to handle the 3.1GB file without memory pressure.
 */
export async function downloadGpkg(log: (msg: string) => void | Promise<void>): Promise<string> {
  const dest = join(tmpdir(), GPKG_FILENAME);

  // Skip download if we already have a valid file from a recent run
  if (existsSync(dest)) {
    const size = statSync(dest).size;
    if (size > 2_000_000_000) {
      await log(`[ogim] Reusing existing download (${(size / 1e9).toFixed(1)} GB)`);
      return dest;
    }
    unlinkSync(dest);
  }

  await log('[ogim] Downloading OGIM v2.7 GeoPackage (3.1 GB)...');

  const res = await fetch(GPKG_URL, {
    headers: { 'User-Agent': 'pharos-osint/1.0' },
  });

  if (!res.ok) throw new Error(`OGIM download failed: ${res.status}`);
  if (!res.body) throw new Error('No response body');

  const total = Number(res.headers.get('content-length') || 0);
  const ws = createWriteStream(dest);
  let downloaded = 0;
  let lastLog = 0;

  const reader = res.body.getReader();
  const nodeStream = new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
        return;
      }
      downloaded += value.length;
      const now = Date.now();
      if (now - lastLog > 30_000) {
        const pct = total > 0 ? Math.round((downloaded / total) * 100) : 0;
        await log(`[ogim] Downloaded ${(downloaded / 1e9).toFixed(1)} GB / ${(total / 1e9).toFixed(1)} GB (${pct}%)`);
        lastLog = now;
      }
      this.push(value);
    },
  });

  await pipeline(nodeStream, ws);

  const finalSize = statSync(dest).size;
  await log(`[ogim] Download complete: ${(finalSize / 1e9).toFixed(2)} GB`);

  if (finalSize < 2_000_000_000) {
    unlinkSync(dest);
    throw new Error(`OGIM download incomplete: ${finalSize} bytes (expected ~3.1 GB)`);
  }

  return dest;
}

/**
 * Extract a layer from the GeoPackage as GeoJSON using ogr2ogr.
 * Returns parsed GeoJSON features.
 */
async function extractLayer(
  gpkgPath: string,
  layerName: string,
  whereClause?: string,
): Promise<Array<Record<string, unknown>>> {
  const args = [
    '-f', 'GeoJSON',
    '/dev/stdout',
    gpkgPath,
    layerName,
  ];

  if (whereClause) {
    args.push('-where', whereClause);
  }

  const { stdout } = await execFileAsync('ogr2ogr', args, {
    maxBuffer: 500 * 1024 * 1024, // 500MB for large layers
  });

  const geojson = JSON.parse(stdout) as {
    features: Array<{ properties: Record<string, unknown>; geometry: unknown }>;
  };

  return geojson.features.map((f) => ({ ...f.properties, _geometry: f.geometry }));
}

// ─── Point layer extraction ─────────────────────────────────

const POINT_LAYERS = [
  'Crude_Oil_Refineries',
  'LNG_Facilities',
  'Petroleum_Terminals',
  'Natural_Gas_Compressor_Stations',
  'Offshore_Platforms',
  'Gathering_and_Processing',
  'Natural_Gas_Flaring_Detections',
  'Stations_Other',
  'Injection_and_Disposal',
] as const;

function toFacility(props: Record<string, unknown>): OgimFeature {
  return {
    ogimId: Number(props.OGIM_ID),
    category: String(props.CATEGORY || ''),
    region: cleanStr(props.REGION),
    country: String(props.COUNTRY || ''),
    stateProvince: cleanStr(props.STATE_PROV),
    onOffshore: String(props.ON_OFFSHORE || ''),
    name: cleanStr(props.FAC_NAME),
    facId: cleanStr(props.FAC_ID),
    facType: cleanStr(props.FAC_TYPE),
    facStatus: cleanStr(props.FAC_STATUS),
    ogimStatus: cleanStr(props.OGIM_STATUS),
    operator: cleanStr(props.OPERATOR),
    installDate: cleanDate(props.INSTALL_DATE),
    commodity: cleanStr(props.COMMODITY),
    lat: Number(props.LATITUDE || 0),
    lon: Number(props.LONGITUDE || 0),
    liqCapacityBpd: cleanNum(props.LIQ_CAPACITY_BPD),
    liqThroughputBpd: cleanNum(props.LIQ_THROUGHPUT_BPD),
    gasCapacityMmcfd: cleanNum(props.GAS_CAPACITY_MMCFD),
    gasThroughputMmcfd: cleanNum(props.GAS_THROUGHPUT_MMCFD),
    numStorageTanks: cleanInt(props.NUM_STORAGE_TANKS),
    numComprUnits: cleanInt(props.NUM_COMPR_UNITS),
    siteHp: cleanNum(props.SITE_HP),
    // Flaring fields
    flareYear: cleanInt(props.FLARE_YEAR),
    flareTempK: cleanInt(props.AVERAGE_FLARE_TEMP_K),
    gasFlaredMmcf: cleanNum(props.GAS_FLARED_MMCF),
    flareSegmentType: cleanStr(props.SEGMENT_TYPE),
    raw: props,
  };
}

export async function extractFacilities(
  gpkgPath: string,
  log: (msg: string) => void | Promise<void>,
): Promise<OgimFeature[]> {
  const all: OgimFeature[] = [];

  for (const layer of POINT_LAYERS) {
    // Filter injection/disposal to operational only
    const where = layer === 'Injection_and_Disposal'
      ? "OGIM_STATUS = 'OPERATIONAL' OR OGIM_STATUS = 'PRODUCING' OR OGIM_STATUS = 'INJECTING'"
      : undefined;

    await log(`[ogim] Extracting ${layer}...`);
    const rows = await extractLayer(gpkgPath, layer, where);
    const features = rows.map(toFacility).filter((f) => f.lat !== 0 && f.lon !== 0);
    await log(`[ogim] ${layer}: ${features.length} features`);
    all.push(...features);
  }

  return all;
}

// ─── Pipeline extraction (filtered) ─────────────────────────

export async function extractPipelines(
  gpkgPath: string,
  log: (msg: string) => void | Promise<void>,
): Promise<OgimPipelineFeature[]> {
  await log('[ogim] Extracting pipelines (filtered: length > 10km OR has capacity data)...');

  const rows = await extractLayer(
    gpkgPath,
    'Oil_Natural_Gas_Pipelines',
    "PIPE_LENGTH_KM > 10 OR (GAS_CAPACITY_MMCFD != -999 AND GAS_CAPACITY_MMCFD IS NOT NULL) OR (LIQ_CAPACITY_BPD != -999 AND LIQ_CAPACITY_BPD IS NOT NULL)",
  );

  const pipelines = rows.map((props): OgimPipelineFeature => ({
    ogimId: Number(props.OGIM_ID),
    region: cleanStr(props.REGION),
    country: String(props.COUNTRY || ''),
    stateProvince: cleanStr(props.STATE_PROV),
    onOffshore: String(props.ON_OFFSHORE || ''),
    name: cleanStr(props.FAC_NAME),
    facType: cleanStr(props.FAC_TYPE),
    ogimStatus: cleanStr(props.OGIM_STATUS),
    operator: cleanStr(props.OPERATOR),
    commodity: cleanStr(props.COMMODITY),
    diameterMm: cleanNum(props.PIPE_DIAMETER_MM),
    lengthKm: Number(props.PIPE_LENGTH_KM) || 0,
    material: cleanStr(props.PIPE_MATERIAL),
    liqCapacityBpd: cleanNum(props.LIQ_CAPACITY_BPD),
    gasThroughputMmcfd: cleanNum(props.GAS_THROUGHPUT_MMCFD),
    gasCapacityMmcfd: cleanNum(props.GAS_CAPACITY_MMCFD),
    geometry: props._geometry,
    raw: props,
  }));

  await log(`[ogim] Pipelines: ${pipelines.length} features (filtered from 1.86M)`);
  return pipelines;
}

// ─── Basin/Field/Block extraction ────────────────────────────

const POLYGON_LAYERS = [
  'Oil_and_Natural_Gas_Basins',
  'Oil_and_Natural_Gas_Fields',
  'Oil_and_Natural_Gas_License_Blocks',
] as const;

export async function extractBasins(
  gpkgPath: string,
  log: (msg: string) => void | Promise<void>,
): Promise<OgimBasinFeature[]> {
  const all: OgimBasinFeature[] = [];

  for (const layer of POLYGON_LAYERS) {
    await log(`[ogim] Extracting ${layer}...`);
    const rows = await extractLayer(gpkgPath, layer);
    const features = rows.map((props): OgimBasinFeature => ({
      ogimId: Number(props.OGIM_ID),
      category: String(props.CATEGORY || ''),
      region: cleanStr(props.REGION),
      country: String(props.COUNTRY || ''),
      onOffshore: String(props.ON_OFFSHORE || ''),
      name: cleanStr(props.NAME),
      reservoirType: cleanStr(props.RESERVOIR_TYPE),
      areaKm2: Number(props.AREA_KM2) || 0,
      geometry: props._geometry,
      raw: props,
    }));
    await log(`[ogim] ${layer}: ${features.length} features`);
    all.push(...features);
  }

  return all;
}
