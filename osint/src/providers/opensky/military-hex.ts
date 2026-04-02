// ICAO 24-bit hex ranges for known military aircraft operators.
// Source: World Monitor + public registries.
const HEX_RANGES: { start: number; end: number; operator: string; country: string }[] = [
  { start: 0xADF7C8, end: 0xAFFFFF, operator: 'usaf', country: 'USA' },
  { start: 0x400000, end: 0x40003F, operator: 'raf', country: 'UK' },
  { start: 0x43C000, end: 0x43CFFF, operator: 'raf', country: 'UK' },
  { start: 0x3AA000, end: 0x3AFFFF, operator: 'faf', country: 'France' },
  { start: 0x3B7000, end: 0x3BFFFF, operator: 'faf', country: 'France' },
  { start: 0x3EA000, end: 0x3EBFFF, operator: 'gaf', country: 'Germany' },
  { start: 0x3F4000, end: 0x3FBFFF, operator: 'gaf', country: 'Germany' },
  { start: 0x738A00, end: 0x738BFF, operator: 'iaf', country: 'Israel' },
  { start: 0x4D0000, end: 0x4D03FF, operator: 'nato', country: 'NATO' },
  { start: 0x33FF00, end: 0x33FFFF, operator: 'itaf', country: 'Italy' },
  { start: 0x350000, end: 0x3503FF, operator: 'spaf', country: 'Spain' },
  { start: 0x480000, end: 0x480FFF, operator: 'rnlaf', country: 'Netherlands' },
  { start: 0x4B8200, end: 0x4B82FF, operator: 'tuaf', country: 'Turkey' },
  { start: 0x710258, end: 0x71028F, operator: 'rsaf', country: 'Saudi Arabia' },
  { start: 0x710380, end: 0x71039F, operator: 'rsaf', country: 'Saudi Arabia' },
  { start: 0x896800, end: 0x896BFF, operator: 'uaeaf', country: 'UAE' },
  { start: 0x06A200, end: 0x06A3FF, operator: 'qeaf', country: 'Qatar' },
  { start: 0x706000, end: 0x706FFF, operator: 'kaf', country: 'Kuwait' },
  { start: 0x7CF800, end: 0x7CFAFF, operator: 'raaf', country: 'Australia' },
  { start: 0xC2D000, end: 0xC2DFFF, operator: 'rcaf', country: 'Canada' },
  { start: 0x800200, end: 0x8002FF, operator: 'iaf_india', country: 'India' },
  { start: 0x010070, end: 0x01008F, operator: 'eaf', country: 'Egypt' },
];

// Known military callsign prefixes
const MILITARY_CALLSIGNS = [
  'RCH', 'REACH', 'DUKE', 'IRON', 'HAWK', 'VIPER', 'COBRA',
  'TEAL', 'SNTRY', 'ETHAD', 'LAGR', 'NCHO', 'RRR', 'EVAC',
  'NATO', 'ASCOT', 'RAFR', 'FAF', 'GAF', 'TURK',
];

export type MilitaryMatch = {
  operator: string;
  country: string;
};

/**
 * Check if an ICAO hex is in a known military range.
 */
export function identifyMilitary(icao24: string, callsign: string): MilitaryMatch | null {
  const hex = parseInt(icao24, 16);
  if (!isFinite(hex)) return null;

  for (const range of HEX_RANGES) {
    if (hex >= range.start && hex <= range.end) {
      return { operator: range.operator, country: range.country };
    }
  }

  // Fallback: check callsign prefixes
  const cs = callsign.toUpperCase();
  for (const prefix of MILITARY_CALLSIGNS) {
    if (cs.startsWith(prefix)) {
      return { operator: 'unknown', country: 'Unknown' };
    }
  }

  return null;
}
