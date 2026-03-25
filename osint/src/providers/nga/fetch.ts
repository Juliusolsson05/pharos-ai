const NGA_URL = 'https://msi.nga.mil/api/publications/broadcast-warn?status=A&output=json';
const FETCH_TIMEOUT = 15_000;

export type NgaWarning = {
  msgYear: number;
  msgNumber: number;
  navArea: string;
  subregion: string;
  text: string;
  issueDate: string;
  authority: string;
};

// NAVAREAs covering our region of interest
// P = Pacific/Indian (includes Persian Gulf, Arabian Sea, Gulf of Oman)
// A = Atlantic (includes Red Sea, Eastern Med, Suez)
// 4 = Caribbean/Atlantic (some overlap)
const RELEVANT_AREAS = new Set(['P', 'A']);

/**
 * Fetch active navigational warnings from NGA.
 * Filters to NAVAREAs 8+9 (Arabian Sea, Persian Gulf, Indian Ocean).
 */
export async function fetchNgaWarnings(): Promise<NgaWarning[]> {
  const res = await fetch(NGA_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`NGA API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = (await res.json()) as { 'broadcast-warn': NgaWarning[] };
  const all = json['broadcast-warn'] || [];

  return all.filter((w) => RELEVANT_AREAS.has(w.navArea));
}
