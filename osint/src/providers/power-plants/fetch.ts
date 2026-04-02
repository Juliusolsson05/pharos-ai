const CSV_URL = 'https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/global_power_plant_database.csv';
const FETCH_TIMEOUT = 60_000;

export type PowerPlant = {
  gppdIdnr: string;
  name: string;
  countryCode: string;
  countryLong: string;
  lat: number;
  lon: number;
  capacityMw: number;
  primaryFuel: string;
  otherFuel1: string;
  otherFuel2: string;
  otherFuel3: string;
  commissioningYear: number | null;
  owner: string;
  sourceUrl: string;
  estimatedGwh: number | null;
  raw: Record<string, string>;
};

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parseCSV(text: string): Record<string, string>[] {
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const lines = clean.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= headers.length - 1) {
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || '';
      }
      rows.push(row);
    }
  }

  return rows;
}

export async function fetchPowerPlants(): Promise<PowerPlant[]> {
  const res = await fetch(CSV_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) throw new Error(`WRI Power Plants download failed: ${res.status}`);

  const text = await res.text();
  const rows = parseCSV(text);
  const plants: PowerPlant[] = [];

  for (const r of rows) {
    const lat = parseNum(r['latitude']);
    const lon = parseNum(r['longitude']);
    const id = r['gppd_idnr'];
    const capacity = parseNum(r['capacity_mw']);
    if (lat == null || lon == null || !id || capacity == null) continue;

    plants.push({
      gppdIdnr: id,
      name: r['name'] || '',
      countryCode: r['country'] || '',
      countryLong: r['country_long'] || '',
      lat,
      lon,
      capacityMw: capacity,
      primaryFuel: r['primary_fuel'] || '',
      otherFuel1: r['other_fuel1'] || '',
      otherFuel2: r['other_fuel2'] || '',
      otherFuel3: r['other_fuel3'] || '',
      commissioningYear: parseNum(r['commissioning_year']),
      owner: r['owner'] || '',
      sourceUrl: r['url'] || '',
      estimatedGwh: parseNum(r['estimated_generation_gwh']),
      raw: r,
    });
  }

  return plants;
}
