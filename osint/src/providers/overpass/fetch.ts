const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const FETCH_TIMEOUT = 120_000;
const DELAY_BETWEEN_REGIONS_MS = 15_000;

export type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

type Logger = (msg: string) => Promise<void>;

const REGIONS = [
  { name: 'europe', bbox: '35,-25,72,45' },
  { name: 'middle-east', bbox: '10,25,45,65' },
  { name: 'africa', bbox: '-35,-20,37,52' },
  { name: 'asia', bbox: '5,65,55,145' },
  { name: 'east-asia', bbox: '20,100,55,150' },
  { name: 'north-america', bbox: '15,-170,72,-50' },
  { name: 'south-america', bbox: '-56,-82,13,-34' },
  { name: 'oceania', bbox: '-48,110,0,180' },
];

function buildQuery(bbox: string) {
  return `
[out:json][timeout:90];
(
  nwr(${bbox})[military~"^(base|airfield|naval_base|barracks|range|checkpoint)$"];
  nwr(${bbox})[aeroway=aerodrome][military];
  nwr(${bbox})[landuse=military]["name"];
);
out center tags;
`;
}

function parseElements(elements: Array<Record<string, unknown>>): OverpassElement[] {
  return elements
    .filter((e) => {
      const lat = (e.lat ?? (e.center as Record<string, number>)?.lat) as number;
      const lon = (e.lon ?? (e.center as Record<string, number>)?.lon) as number;
      return isFinite(lat) && isFinite(lon);
    })
    .map((e) => ({
      type: e.type as OverpassElement['type'],
      id: e.id as number,
      lat: ((e.lat ?? (e.center as Record<string, number>)?.lat) as number),
      lon: ((e.lon ?? (e.center as Record<string, number>)?.lon) as number),
      tags: (e.tags as Record<string, string>) || {},
    }));
}

/**
 * Fetch military installations from OSM Overpass API globally.
 * Splits into regional queries with delays to avoid rate limiting.
 */
export const REGION_NAMES = REGIONS.map((r) => r.name);

export async function fetchOverpass(log: Logger, regionFilter?: string[]): Promise<OverpassElement[]> {
  const seen = new Set<string>();
  const all: OverpassElement[] = [];
  const regionResults: string[] = [];

  const targets = regionFilter
    ? REGIONS.filter((r) => regionFilter.includes(r.name))
    : REGIONS;

  if (targets.length === 0) {
    await log(`No matching regions for filter: ${regionFilter?.join(', ')}`);
    return [];
  }

  await log(`Starting Overpass fetch across ${targets.length} regions: ${targets.map((r) => r.name).join(', ')}`);

  for (let i = 0; i < targets.length; i++) {
    const region = targets[i];

    if (i > 0) {
      await log(`Waiting ${DELAY_BETWEEN_REGIONS_MS / 1000}s before next region...`);
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_REGIONS_MS));
    }

    await log(`[${i + 1}/${REGIONS.length}] Fetching ${region.name} (bbox: ${region.bbox})`);
    const start = Date.now();

    try {
      const query = buildQuery(region.bbox);
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });

      if (!res.ok) {
        const body = (await res.text()).slice(0, 100);
        await log(`[${i + 1}/${REGIONS.length}] ${region.name} — HTTP ${res.status}: ${body}`);
        regionResults.push(`${region.name}: FAILED (${res.status})`);
        continue;
      }

      const json = (await res.json()) as { elements: Array<Record<string, unknown>> };
      const elements = parseElements(json.elements);
      const ms = Date.now() - start;

      let newCount = 0;
      let dupeCount = 0;
      for (const el of elements) {
        const key = `${el.type}-${el.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          all.push(el);
          newCount++;
        } else {
          dupeCount++;
        }
      }

      await log(`[${i + 1}/${REGIONS.length}] ${region.name} — ${elements.length} elements, ${newCount} new, ${dupeCount} dupes, ${all.length} total (${ms}ms)`);
      regionResults.push(`${region.name}: ${newCount} new`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await log(`[${i + 1}/${REGIONS.length}] ${region.name} — FAILED: ${msg}`);
      regionResults.push(`${region.name}: FAILED (${msg.slice(0, 50)})`);
    }
  }

  await log(`Overpass fetch complete: ${all.length} unique installations from ${targets.length} regions`);
  await log(`Region summary: ${regionResults.join(' | ')}`);

  return all;
}
