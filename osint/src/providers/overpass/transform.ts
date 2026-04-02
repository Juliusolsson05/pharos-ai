import type { OverpassElement } from './fetch.js';

type AssetType = 'AIR_BASE' | 'NAVAL_BASE' | 'ARMY_BASE';

export type InstallationRecord = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: AssetType;
  operator: string | null;
  country: string | null;
};

function classifyType(tags: Record<string, string>): AssetType {
  const mil = tags.military || '';
  const service = tags.military_service || '';

  if (mil === 'airfield' || mil === 'air_base') return 'AIR_BASE';
  if (tags.aeroway === 'aerodrome' && mil) return 'AIR_BASE';
  if (mil === 'naval_base' || service === 'navy') return 'NAVAL_BASE';
  if (service === 'air_force') return 'AIR_BASE';
  return 'ARMY_BASE';
}

export function buildInstallations(elements: OverpassElement[]): InstallationRecord[] {
  return elements
    .filter((e) => e.tags.name || e.tags['name:en'])
    .map((e) => ({
      id: `osm-${e.type}-${e.id}`,
      name: e.tags['name:en'] || e.tags.name || 'Unnamed',
      lat: e.lat,
      lon: e.lon,
      type: classifyType(e.tags),
      operator: e.tags.operator || null,
      country: e.tags['addr:country'] || e.tags['is_in:country'] || null,
    }));
}
