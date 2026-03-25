import { config } from '../../config.js';

const FETCH_TIMEOUT = 20_000;

// Middle East bounding box: west,south,east,north
const BBOX = '25,10,65,42';

export type FirmsRow = {
  latitude: number;
  longitude: number;
  brightTi4: number;
  acqDate: string;
  acqTime: string;
  satellite: string;
  confidence: string;
  frp: number;
  daynight: string;
};

/**
 * Fetch VIIRS thermal hotspots from NASA FIRMS for the Middle East region.
 * Returns parsed CSV rows for the last N days.
 */
export async function fetchFirms(days: number = 1): Promise<FirmsRow[]> {
  const key = config.firms.mapKey;
  if (!key) {
    throw new Error('NASA_FIRMS_MAP_KEY must be set');
  }

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/${BBOX}/${days}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FIRMS API ${res.status}: ${text.slice(0, 200)}`);
  }

  const csv = await res.text();
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  // First line is header
  const header = lines[0].split(',').map((h) => h.trim());
  const colIdx = (name: string) => header.indexOf(name);

  const iLat = colIdx('latitude');
  const iLon = colIdx('longitude');
  const iBright = colIdx('bright_ti4');
  const iDate = colIdx('acq_date');
  const iTime = colIdx('acq_time');
  const iSat = colIdx('satellite');
  const iConf = colIdx('confidence');
  const iFrp = colIdx('frp');
  const iDn = colIdx('daynight');

  const rows: FirmsRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 10) continue;

    const lat = parseFloat(cols[iLat]);
    const lon = parseFloat(cols[iLon]);
    if (!isFinite(lat) || !isFinite(lon)) continue;

    rows.push({
      latitude: lat,
      longitude: lon,
      brightTi4: parseFloat(cols[iBright]) || 0,
      acqDate: cols[iDate] || '',
      acqTime: cols[iTime] || '',
      satellite: cols[iSat] || '',
      confidence: cols[iConf] || '',
      frp: parseFloat(cols[iFrp]) || 0,
      daynight: cols[iDn]?.trim() || '',
    });
  }

  return rows;
}
