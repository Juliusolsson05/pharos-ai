import type { OgimFeature, OgimPipelineFeature, OgimBasinFeature } from './fetch.js';

type FacilityMapFeature = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  priority: string;
  country: string;
  category: string;
};

const CATEGORY_TYPE_MAP: Record<string, string> = {
  'CRUDE OIL REFINERIES': 'REFINERY',
  'LNG FACILITIES': 'LNG_TERMINAL',
  'PETROLEUM TERMINALS': 'OIL_TERMINAL',
  'NATURAL GAS COMPRESSOR STATIONS': 'COMPRESSOR_STATION',
  'OFFSHORE PLATFORMS': 'OFFSHORE_PLATFORM',
  'GATHERING AND PROCESSING': 'PROCESSING_PLANT',
  'NATURAL GAS FLARING DETECTIONS': 'FLARING_SITE',
  'STATIONS - OTHER': 'GAS_STATION',
  'INJECTION AND DISPOSAL': 'INJECTION_WELL',
};

function priorityForCategory(category: string, feature: OgimFeature): string {
  // Refineries and LNG are always high priority
  if (category === 'CRUDE OIL REFINERIES' || category === 'LNG FACILITIES') return 'P1';

  // Large capacity facilities
  if ((feature.liqCapacityBpd ?? 0) > 100_000) return 'P1';
  if ((feature.gasCapacityMmcfd ?? 0) > 500) return 'P1';

  // Offshore platforms
  if (category === 'OFFSHORE PLATFORMS') return 'P2';

  // Medium capacity
  if ((feature.liqCapacityBpd ?? 0) > 10_000) return 'P2';
  if ((feature.gasCapacityMmcfd ?? 0) > 50) return 'P2';

  return 'P3';
}

export function buildFacilityFeatures(facilities: OgimFeature[]): FacilityMapFeature[] {
  return facilities.map((f) => ({
    id: `ogim-${f.ogimId}`,
    name: f.name || f.category,
    lat: f.lat,
    lon: f.lon,
    type: CATEGORY_TYPE_MAP[f.category] || 'OIL_GAS_FACILITY',
    priority: priorityForCategory(f.category, f),
    country: f.country,
    category: f.category,
  }));
}

export function buildPipelineFeatures(pipelines: OgimPipelineFeature[]) {
  return pipelines.map((p) => ({
    id: `ogim-pipe-${p.ogimId}`,
    name: p.name || `Pipeline (${p.lengthKm.toFixed(0)} km)`,
    type: 'PIPELINE',
    priority: p.lengthKm > 100 || (p.gasCapacityMmcfd ?? 0) > 100 || (p.liqCapacityBpd ?? 0) > 50_000 ? 'P2' : 'P3',
    country: p.country,
    geometry: p.geometry,
  }));
}

export function buildBasinFeatures(basins: OgimBasinFeature[]) {
  return basins.map((b) => ({
    id: `ogim-basin-${b.ogimId}`,
    name: b.name || b.category,
    type: b.category.includes('BASIN') ? 'OIL_GAS_BASIN' : b.category.includes('FIELD') ? 'OIL_GAS_FIELD' : 'LICENSE_BLOCK',
    priority: 'P3',
    country: b.country,
    geometry: b.geometry,
  }));
}
