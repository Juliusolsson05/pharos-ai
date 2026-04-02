import { config } from '../../config.js';

const OUTAGES_URL = 'https://api.cloudflare.com/client/v4/radar/annotations/outages';
const FETCH_TIMEOUT = 15_000;

export type RadarOutage = {
  id: string;
  asn: number | null;
  asnName: string;
  asnCountry: string;
  startDate: string;
  endDate: string | null;
  scope: string;
  description: string;
  linkedUrl: string;
  lat: number | null;
  lon: number | null;
};

// Country codes in our region of interest
const ME_COUNTRIES = new Set([
  'IR', 'IQ', 'SY', 'LB', 'IL', 'PS', 'JO', 'SA', 'AE', 'QA', 'BH', 'KW', 'OM', 'YE',
  'EG', 'TR', 'CY', 'DJ', 'SD', 'LY', 'PK', 'AF',
]);

// Approximate country centroids for map placement
const COUNTRY_COORDS: Record<string, [number, number]> = {
  IR: [53.69, 32.43], IQ: [43.68, 33.22], SY: [38.99, 34.80], LB: [35.86, 33.87],
  IL: [34.85, 31.05], PS: [35.23, 31.95], JO: [36.24, 30.59], SA: [45.08, 23.89],
  AE: [53.85, 23.42], QA: [51.18, 25.35], BH: [50.56, 26.07], KW: [47.48, 29.31],
  OM: [55.92, 21.51], YE: [48.52, 15.55], EG: [30.80, 26.82], TR: [35.24, 38.96],
  CY: [33.43, 35.13], DJ: [42.59, 11.83], SD: [30.22, 12.86], LY: [17.23, 26.34],
  PK: [69.35, 30.38], AF: [67.71, 33.94],
};

/**
 * Fetch internet outages from Cloudflare Radar API.
 * Filters to Middle East countries.
 */
export async function fetchOutages(): Promise<RadarOutage[]> {
  const token = config.cloudflareRadar.token;
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN must be set');

  const res = await fetch(`${OUTAGES_URL}?dateRange=7d&limit=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) throw new Error(`Cloudflare Radar ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = (await res.json()) as {
    success: boolean;
    result: {
      annotations: Array<{
        id: string;
        asn: number | null;
        asnName: string;
        locations: string; // comma-separated country codes
        startDate: string;
        endDate: string | null;
        scope: string;
        description: string;
        linkedUrl: string;
      }>;
    };
  };

  if (!data.success) throw new Error('Cloudflare Radar returned success: false');

  const outages: RadarOutage[] = [];

  for (const a of data.result.annotations) {
    const countries = (a.locations || '').split(',').map((c) => c.trim().toUpperCase());
    const meCountry = countries.find((c) => ME_COUNTRIES.has(c));
    if (!meCountry) continue;

    const coords = COUNTRY_COORDS[meCountry];

    outages.push({
      id: a.id || `outage-${a.asn}-${a.startDate}`,
      asn: a.asn,
      asnName: a.asnName || '',
      asnCountry: meCountry,
      startDate: a.startDate,
      endDate: a.endDate,
      scope: a.scope || '',
      description: a.description || '',
      linkedUrl: a.linkedUrl || '',
      lat: coords ? coords[1] : null,
      lon: coords ? coords[0] : null,
    });
  }

  return outages;
}
