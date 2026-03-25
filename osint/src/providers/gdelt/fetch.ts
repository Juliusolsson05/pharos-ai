import AdmZip from 'adm-zip';

import { config } from '../../config.js';
import type { GdeltRow } from '../../types.js';

const FETCH_TIMEOUT = 20_000;

// CAMEO root codes for conflict/kinetic events
const CONFLICT_ROOTS = new Set(['18', '19', '20']);

/**
 * Get the latest GDELT 2.0 export CSV URL from the lastupdate file.
 * Returns the .export.CSV.zip URL.
 */
export async function fetchLatestExportUrl(): Promise<string> {
  const res = await fetch(config.gdelt.lastUpdateUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`lastupdate.txt returned ${res.status}`);
  }

  const text = await res.text();
  const firstLine = text.trim().split('\n')[0];
  if (!firstLine) throw new Error('lastupdate.txt is empty');

  // Format: "<size> <md5> <url>"
  const parts = firstLine.trim().split(/\s+/);
  const url = parts[parts.length - 1];
  if (!url || !url.endsWith('.export.CSV.zip')) {
    throw new Error(`Unexpected lastupdate format: ${firstLine}`);
  }

  return url;
}

/**
 * Download a GDELT export ZIP, extract the CSV, parse tab-separated rows,
 * and filter for conflict events with valid coordinates.
 */
export async function downloadAndParse(zipUrl: string): Promise<{
  rows: GdeltRow[];
  rawZip: Buffer;
}> {
  const res = await fetch(zipUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`GDELT ZIP download failed: ${res.status}`);
  }

  const rawZip = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(rawZip);
  const entries = zip.getEntries();

  if (entries.length === 0) {
    throw new Error('GDELT ZIP is empty');
  }

  const csv = entries[0].getData().toString('utf-8');
  const lines = csv.split('\n').filter((l) => l.trim().length > 0);

  const rows: GdeltRow[] = [];

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 61) continue;

    const eventCode = cols[26] || '';
    const root = eventCode.slice(0, 2);
    if (!CONFLICT_ROOTS.has(root)) continue;

    const lat = parseFloat(cols[56]);
    const lon = parseFloat(cols[57]);
    if (!isFinite(lat) || !isFinite(lon)) continue;
    if (lat === 0 && lon === 0) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    rows.push({
      globalEventId: cols[0],
      day: cols[1],
      actor1Name: cols[5] || 'Unknown',
      actor2Name: cols[15] || '',
      eventCode,
      numMentions: parseInt(cols[30], 10) || 1,
      avgTone: parseFloat(cols[34]) || 0,
      countryCode: cols[53] || '',
      lat,
      lon,
      sourceUrl: cols[60] || '',
      raw: cols,
    });
  }

  return { rows, rawZip };
}
