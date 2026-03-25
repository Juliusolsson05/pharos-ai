import type { NgaWarning } from './fetch.js';

export type WarningRecord = {
  id: string;
  name: string;
  coordinates: [number, number][];
  issueDate: string;
  text: string;
};

// Pattern: 24-54.89N 052-21.66E (degrees-minutes format)
const COORD_RE = /(\d{1,2})-(\d{2}(?:\.\d+)?)(N|S)\s+(\d{1,3})-(\d{2}(?:\.\d+)?)(E|W)/g;

function parseDegMin(deg: string, min: string, dir: string): number {
  let val = parseInt(deg, 10) + parseFloat(min) / 60;
  if (dir === 'S' || dir === 'W') val = -val;
  return val;
}

/**
 * Extract coordinates from NGA warning text.
 * Returns all parsed lat/lon pairs found in the text.
 */
function extractCoords(text: string): [number, number][] {
  const coords: [number, number][] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  COORD_RE.lastIndex = 0;
  while ((match = COORD_RE.exec(text)) !== null) {
    const lat = parseDegMin(match[1], match[2], match[3]);
    const lon = parseDegMin(match[4], match[5], match[6]);
    if (isFinite(lat) && isFinite(lon)) {
      coords.push([lon, lat]);
    }
  }

  return coords;
}

/**
 * Transform NGA warnings into threat zone records.
 * Only includes warnings that have parseable coordinates.
 */
export function buildWarnings(warnings: NgaWarning[]): WarningRecord[] {
  const records: WarningRecord[] = [];

  for (const w of warnings) {
    const coords = extractCoords(w.text);
    if (coords.length === 0) continue;

    records.push({
      id: `nga-${w.navArea}-${w.msgYear}-${w.msgNumber}`,
      name: `NAVAREA ${w.navArea} ${w.msgNumber}/${w.msgYear}`,
      coordinates: coords,
      issueDate: w.issueDate || '',
      text: w.text.slice(0, 500),
    });
  }

  return records;
}
