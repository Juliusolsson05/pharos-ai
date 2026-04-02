const PAGE_SIZE = 1000;
const MAX_PAGES = 5;
const FETCH_TIMEOUT = 90_000;

export type UcdpEvent = {
  id: string;
  type: number; // 1=state-based, 2=non-state, 3=one-sided
  lat: number;
  lon: number;
  country: string;
  region: string;
  dateStart: string;
  dateEnd: string;
  deathsBest: number;
  sideA: string;
  sideB: string;
  sourceArticle: string;
};

function buildVersionCandidates(): string[] {
  const year = new Date().getFullYear() - 2000;
  return [`${year}.1`, `${year - 1}.1`, '25.1', '24.1'];
}

async function fetchPage(version: string, page: number): Promise<{ Result: Record<string, unknown>[] }> {
  const url = `https://ucdpapi.pcr.uu.se/api/gedevents/${version}?pagesize=${PAGE_SIZE}&page=${page}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) throw new Error(`UCDP API ${res.status} (v${version}, page ${page})`);
  return res.json() as Promise<{ Result: Record<string, unknown>[] }>;
}

/**
 * Discover the latest UCDP GED version and fetch all events.
 */
export async function fetchUcdpEvents(): Promise<UcdpEvent[]> {
  const candidates = buildVersionCandidates();
  let version = '';
  let firstPage: Record<string, unknown>[] = [];

  for (const v of candidates) {
    try {
      const data = await fetchPage(v, 0);
      if (Array.isArray(data.Result) && data.Result.length > 0) {
        version = v;
        firstPage = data.Result;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!version) throw new Error('No UCDP GED version found');

  const allRows = [...firstPage];

  // Fetch remaining pages
  for (let page = 1; page < MAX_PAGES; page++) {
    if (firstPage.length < PAGE_SIZE) break;
    try {
      const data = await fetchPage(version, page);
      if (!data.Result?.length) break;
      allRows.push(...data.Result);
      if (data.Result.length < PAGE_SIZE) break;
    } catch {
      break;
    }
  }

  return allRows
    .filter((r) => {
      const lat = Number(r.latitude);
      const lon = Number(r.longitude);
      return isFinite(lat) && isFinite(lon) && !(lat === 0 && lon === 0);
    })
    .map((r) => ({
      id: String(r.id || r.event_id || ''),
      type: Number(r.type_of_violence) || 1,
      lat: Number(r.latitude),
      lon: Number(r.longitude),
      country: String(r.country || ''),
      region: String(r.region || ''),
      dateStart: String(r.date_start || ''),
      dateEnd: String(r.date_end || ''),
      deathsBest: Number(r.best) || 0,
      sideA: String(r.side_a || ''),
      sideB: String(r.side_b || ''),
      sourceArticle: String(r.source_article || ''),
    }));
}
