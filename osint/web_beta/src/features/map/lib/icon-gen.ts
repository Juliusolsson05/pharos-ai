import ms from 'milsymbol';

const ICON_SIZE = 18;

export type IconEntry = {
  url: string;
  width: number;
  height: number;
  anchorY: number;
};

type SymbolOptions = {
  frame?: boolean;
  icon?: boolean;
};

const cache = new Map<string, IconEntry>();

function generate(sidc: string, options: SymbolOptions = {}): IconEntry {
  const { frame = true, icon = true } = options;
  const sym = new ms.Symbol(sidc, {
    size: ICON_SIZE,
    frame,
    icon,
    fill: true,
    strokeWidth: 4,
    outlineWidth: 3,
    outlineColor: 'white',
  });

  return {
    url: sym.toDataURL(),
    width: Math.ceil(sym.getSize().width),
    height: Math.ceil(sym.getSize().height),
    anchorY: Math.ceil(sym.getAnchor().y),
  };
}

export function getOrCreate(key: string, sidc: string, options: SymbolOptions = {}): IconEntry {
  let entry = cache.get(key);
  if (!entry) {
    entry = generate(sidc, options);
    cache.set(key, entry);
  }
  return entry;
}

export function createSvgIcon(key: string, svg: string, anchorY: number): IconEntry {
  let entry = cache.get(key);
  if (entry) return entry;

  entry = {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width: 64,
    height: 64,
    anchorY,
  };
  cache.set(key, entry);
  return entry;
}

// ─── SIDC Constants ─────────────────────────────────────────

export const AIRCRAFT_SIDCS: Record<string, string> = {
  friendly: '10030100001101000000',
  hostile:  '10060100001101000000',
  neutral:  '10040100001101000000',
  unknown:  '10010100001101000000',
};

export const VESSEL_SIDCS: Record<string, string> = {
  military: '10033000001208000000',
  tanker:   '10043000001401090000',
  cargo:    '10043000001401010000',
  neutral:  '10043000001401000000',
  unknown:  '10013000001401000000',
};

export function installationSidc(affiliation: string, entityCode: string): string {
  const id = affiliation === 'HOSTILE' ? '06' : affiliation === 'FRIENDLY' ? '03' : '04';
  return `10${id}200000${entityCode}0000`;
}

export const INSTALLATION_ENTITIES: Record<string, string> = {
  AIR_BASE:    '120803',
  NAVAL_BASE:  '121310',
  ARMY_BASE:   '120802',
  NUCLEAR_SITE:'111500',
  COMMAND:     '120600',
  LAUNCH_ZONE: '111400',
};

export const EVENT_SIDCS: Record<string, string> = {
  earthquake:  '10004000001701030000',
  aftershock:  '10004000001701010000',
  volcano:     '10004000001701060000',
  wildfire:    '10004000001408000000',
  hotspot:     '10004000001403000000',
  flood:       '10004000001702020000',
  storm:       '10004000001702010000',
  landslide:   '10004000001701040000',
};
