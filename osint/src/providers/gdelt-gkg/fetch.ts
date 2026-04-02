import AdmZip from 'adm-zip';

import { config } from '../../config.js';

const FETCH_TIMEOUT = 30_000;

// Conflict-relevant GKG themes
const CONFLICT_THEMES = new Set([
  'ARMEDCONFLICT', 'MILITARY', 'TERROR', 'DRONES', 'MISSILE',
  'CRISISLEX_CRISISLEXREC', 'CRISISLEX_T03_DEAD', 'CRISISLEX_T11_TRAPPED',
  'REBELS', 'KILL', 'WB_2433_CONFLICT_AND_VIOLENCE',
  'BLOCKADE', 'CEASEFIRE', 'EVACUATION', 'AIRSTRIKE',
]);

export type GkgRecord = {
  recordId: string;
  date: string;
  domain: string;
  url: string;
  themes: string[];
  locations: GkgLocation[];
  persons: string[];
  organizations: string[];
  tone: number;
  imageUrl: string;
  pageTitle: string;
  raw: string[];
};

export type GkgLocation = {
  type: number;
  name: string;
  countryCode: string;
  lat: number;
  lon: number;
};

function parseLocations(field: string): GkgLocation[] {
  if (!field) return [];
  const locs: GkgLocation[] = [];

  for (const segment of field.split(';')) {
    const parts = segment.split('#');
    if (parts.length < 7) continue;

    const lat = parseFloat(parts[4] || parts[5]);
    const lon = parseFloat(parts[5] || parts[6]);
    if (!isFinite(lat) || !isFinite(lon)) continue;
    if (lat === 0 && lon === 0) continue;

    locs.push({
      type: parseInt(parts[0]) || 0,
      name: parts[1] || '',
      countryCode: parts[2] || '',
      lat,
      lon,
    });
  }

  return locs;
}

function extractPageTitle(extrasXml: string): string {
  const match = extrasXml?.match(/<PAGE_TITLE>(.*?)<\/PAGE_TITLE>/i);
  return match ? match[1] : '';
}

/**
 * Fetch the latest GKG export URL from lastupdate.txt.
 */
export async function fetchLatestGkgUrl(): Promise<string> {
  const res = await fetch(config.gdelt.lastUpdateUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });
  if (!res.ok) throw new Error(`lastupdate.txt ${res.status}`);

  const text = await res.text();
  const lines = text.trim().split('\n');

  // GKG is the third line (after export and mentions)
  for (const line of lines) {
    if (line.includes('.gkg.csv.zip') || line.includes('.gkg.CSV.zip')) {
      const parts = line.trim().split(/\s+/);
      return parts[parts.length - 1];
    }
  }

  throw new Error('No GKG URL found in lastupdate.txt');
}

/**
 * Download GKG ZIP, extract, parse, and filter for conflict-relevant records.
 */
export async function downloadAndParse(zipUrl: string): Promise<{
  records: GkgRecord[];
  rawZip: Buffer;
  totalRows: number;
}> {
  const res = await fetch(zipUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`GKG download ${res.status}`);

  const rawZip = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(rawZip);
  const entries = zip.getEntries();
  if (entries.length === 0) throw new Error('GKG ZIP empty');

  const csv = entries[0].getData().toString('utf-8');
  const lines = csv.split('\n').filter((l) => l.trim().length > 0);

  const records: GkgRecord[] = [];

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 27) continue;

    // Filter: only keep records with conflict-relevant themes
    const themes = (cols[7] || '').split(';').map((t) => t.trim()).filter(Boolean);
    const hasConflictTheme = themes.some((t) => CONFLICT_THEMES.has(t));
    if (!hasConflictTheme) continue;

    // Must have at least one location with coords
    const locations = parseLocations(cols[9]);
    if (locations.length === 0) continue;

    const pageTitle = extractPageTitle(cols[26] || '');

    records.push({
      recordId: cols[0] || '',
      date: cols[1] || '',
      domain: cols[3] || '',
      url: cols[4] || '',
      themes,
      locations,
      persons: (cols[11] || '').split(';').map((p) => p.trim()).filter(Boolean),
      organizations: (cols[13] || '').split(';').map((o) => o.trim()).filter(Boolean),
      tone: parseFloat((cols[15] || '').split(',')[0]) || 0,
      imageUrl: cols[18] || '',
      pageTitle,
      raw: cols,
    });
  }

  return { records, rawZip, totalRows: lines.length };
}
