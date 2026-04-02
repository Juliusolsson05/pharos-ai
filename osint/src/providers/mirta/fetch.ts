const BASE_URL = 'https://services7.arcgis.com/n1YM8pTrFmm7L4hs/arcgis/rest/services/mirta/FeatureServer/0/query';
const PAGE_SIZE = 500;
const FETCH_TIMEOUT = 30_000;

export type MirtaSite = {
  objectId: number;
  siteName: string;
  featureName: string;
  featureDescription: string;
  countryName: string;
  stateCode: string;
  reportingComponent: string;
  operationalStatus: string;
  isJointBase: boolean;
  lat: number;
  lon: number;
};

const COMPONENT_MAP: Record<string, string> = {
  usa: 'US Army',
  usaf: 'US Air Force',
  usn: 'US Navy',
  usmc: 'US Marine Corps',
  usar: 'US Army Reserve',
  usmcr: 'US Marine Corps Reserve',
  usnr: 'US Naval Reserve',
  armyNationalGuard: 'Army National Guard',
  airNationalGuard: 'Air National Guard',
  afr: 'Air Force Reserve',
  whs: 'Washington Headquarters Services',
  other: 'Other',
};

export function componentLabel(code: string): string {
  return COMPONENT_MAP[code] || code;
}

/**
 * Fetch all MIRTA DoD installations via paginated ArcGIS queries.
 */
export async function fetchMirta(): Promise<MirtaSite[]> {
  const all: MirtaSite[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      f: 'json',
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
    });

    const res = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!res.ok) throw new Error(`MIRTA API ${res.status}`);

    const data = (await res.json()) as {
      features: Array<{
        attributes: Record<string, unknown>;
        geometry: { x: number; y: number };
      }>;
      exceededTransferLimit?: boolean;
    };

    for (const f of data.features) {
      const a = f.attributes;
      const geo = f.geometry;
      if (!geo?.x || !geo?.y) continue;

      all.push({
        objectId: Number(a.OBJECTID) || 0,
        siteName: String(a.SITENAME || ''),
        featureName: String(a.FEATURENAME || ''),
        featureDescription: String(a.FEATUREDESCRIPTION || ''),
        countryName: String(a.COUNTRYNAME || ''),
        stateCode: String(a.STATENAMECODE || ''),
        reportingComponent: String(a.SITEREPORTINGCOMPONENT || ''),
        operationalStatus: String(a.SITEOPERATIONALSTATUS || ''),
        isJointBase: a.ISJOINTBASE === 'yes',
        lat: geo.y,
        lon: geo.x,
      });
    }

    if (!data.exceededTransferLimit || data.features.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}
