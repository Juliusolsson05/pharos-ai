const CSV_URL = 'https://msi.nga.mil/api/publications/download?type=view&key=16920959/SFH00000/UpdatedPub150.csv';
const FETCH_TIMEOUT = 60_000;

export type Port = {
  wpiNumber: number;
  name: string;
  alternateName: string;
  countryCode: string;
  regionName: string;
  worldWaterBody: string;
  unLocode: string;
  lat: number;
  lon: number;
  harborSize: string;
  harborType: string;
  harborUse: string;
  shelterAfforded: string;
  maxVesselLength: number | null;
  maxVesselDraft: number | null;
  channelDepth: number | null;
  anchorageDepth: number | null;
  cargoPierDepth: number | null;
  oilTerminalDepth: number | null;
  repairCapability: string;
  drydock: string;
  railway: string;
  hasOilTerminal: boolean;
  hasLngTerminal: boolean;
  hasContainer: boolean;
  hasBulk: boolean;
  hasCranes: boolean;
  raw: Record<string, string>;
};

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parseBool(val: string | undefined): boolean {
  return val === 'Yes' || val === 'Y';
}

function parseRow(headers: string[], values: string[]): Record<string, string> {
  const row: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    row[headers[i]] = values[i] || '';
  }
  return row;
}

function parseCSV(text: string): Record<string, string>[] {
  // Handle BOM
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const lines = clean.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted CSV fields
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
      rows.push(parseRow(headers, values));
    }
  }

  return rows;
}

export async function fetchPorts(): Promise<Port[]> {
  const res = await fetch(CSV_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) throw new Error(`NGA WPI download failed: ${res.status}`);

  const text = await res.text();
  const rows = parseCSV(text);
  const ports: Port[] = [];

  for (const r of rows) {
    const lat = parseNum(r['Latitude']);
    const lon = parseNum(r['Longitude']);
    const wpi = parseNum(r['World Port Index Number']);
    if (lat == null || lon == null || wpi == null) continue;

    ports.push({
      wpiNumber: wpi,
      name: r['Main Port Name'] || '',
      alternateName: r['Alternate Port Name'] || '',
      countryCode: r['Country Code'] || '',
      regionName: r['Region Name'] || '',
      worldWaterBody: r['World Water Body'] || '',
      unLocode: r['UN/LOCODE'] || '',
      lat,
      lon,
      harborSize: r['Harbor Size'] || '',
      harborType: r['Harbor Type'] || '',
      harborUse: r['Harbor Use'] || '',
      shelterAfforded: r['Shelter Afforded'] || '',
      maxVesselLength: parseNum(r['Max Vessel Length (m)']),
      maxVesselDraft: parseNum(r['Max Vessel Draft (m)']),
      channelDepth: parseNum(r['Channel Depth (m)']),
      anchorageDepth: parseNum(r['Anchorage Depth (m)']),
      cargoPierDepth: parseNum(r['Cargo Pier Depth (m)']),
      oilTerminalDepth: parseNum(r['Oil Terminal Depth (m)']),
      repairCapability: r['Repairs'] || '',
      drydock: r['Dry Dock'] || '',
      railway: r['Railway'] || '',
      hasOilTerminal: parseBool(r['Oil Terminal']),
      hasLngTerminal: parseBool(r['LNG Terminal']),
      hasContainer: parseBool(r['Container']),
      hasBulk: parseBool(r['Solid Bulk']) || parseBool(r['Liquid Bulk']),
      hasCranes: parseBool(r['Cranes - Fixed']) || parseBool(r['Cranes - Mobile']) || parseBool(r['Cranes - Floating']) || parseBool(r['Cranes - Container']),
      raw: r,
    });
  }

  return ports;
}
