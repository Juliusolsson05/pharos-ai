import { config } from '../../config.js';

const FETCH_TIMEOUT = 20_000;
const BBOX = '25,10,65,42';

export type FirmsRow = {
  latitude: number;
  longitude: number;
  brightTi4: number;
  scan: number;
  track: number;
  acqDate: string;
  acqTime: string;
  satellite: string;
  confidence: string;
  version: string;
  brightTi5: number;
  frp: number;
  daynight: string;
};

export async function fetchFirms(days: number = 1): Promise<FirmsRow[]> {
  const key = config.firms.mapKey;
  if (!key) throw new Error('NASA_FIRMS_MAP_KEY must be set');

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/${BBOX}/${days}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });

  if (!res.ok) throw new Error(`FIRMS API ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const csv = await res.text();
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);

  const rows: FirmsRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(',');
    if (c.length < 10) continue;

    const lat = parseFloat(c[col('latitude')]);
    const lon = parseFloat(c[col('longitude')]);
    if (!isFinite(lat) || !isFinite(lon)) continue;

    rows.push({
      latitude: lat,
      longitude: lon,
      brightTi4: parseFloat(c[col('bright_ti4')]) || 0,
      scan: parseFloat(c[col('scan')]) || 0,
      track: parseFloat(c[col('track')]) || 0,
      acqDate: c[col('acq_date')] || '',
      acqTime: c[col('acq_time')] || '',
      satellite: c[col('satellite')] || '',
      confidence: c[col('confidence')] || '',
      version: c[col('version')] || '',
      brightTi5: parseFloat(c[col('bright_ti5')]) || 0,
      frp: parseFloat(c[col('frp')]) || 0,
      daynight: c[col('daynight')]?.trim() || '',
    });
  }

  return rows;
}
