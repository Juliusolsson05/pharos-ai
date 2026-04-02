import {
  AIRCRAFT_SIDCS,
  createSvgIcon,
  EVENT_SIDCS,
  getOrCreate,
  INSTALLATION_ENTITIES,
  installationSidc,
  VESSEL_SIDCS,
} from './icon-gen';
import type { IconEntry } from './icon-gen';

export type { IconEntry };

// ─── Port SVG colors ────────────────────────────────────────

const PORT_COLORS: Record<string, string> = {
  oil:       '#ec9a3c',
  lng:       '#ec9a3c',
  container: '#4c90f0',
  naval:     '#4c90f0',
  default:   '#8f99a8',
};

// ─── Public API ─────────────────────────────────────────────

export function getAircraftIcon(affiliation: string): IconEntry {
  const key = affiliation.toLowerCase();
  const sidc = AIRCRAFT_SIDCS[key] || AIRCRAFT_SIDCS.unknown;
  return getOrCreate(`ac-${key}`, sidc, { icon: false });
}

export function getVesselIcon(shipType: number | null | undefined, affiliation?: string): IconEntry {
  if (affiliation === 'MILITARY' || shipType === 35) {
    return getOrCreate('vs-military', VESSEL_SIDCS.military);
  }
  if (shipType && shipType >= 80 && shipType <= 89) {
    return getOrCreate('vs-tanker', VESSEL_SIDCS.tanker);
  }
  if (shipType && shipType >= 70 && shipType <= 79) {
    return getOrCreate('vs-cargo', VESSEL_SIDCS.cargo);
  }
  return getOrCreate('vs-neutral', VESSEL_SIDCS.neutral);
}

export function getInstallationIcon(type: string, affiliation: string): IconEntry {
  const entity = INSTALLATION_ENTITIES[type] || INSTALLATION_ENTITIES.ARMY_BASE;
  const sidc = installationSidc(affiliation, entity);
  const key = `inst-${type}-${affiliation}`;
  return getOrCreate(key, sidc);
}

export function getOverpassIcon(military: string | null | undefined): IconEntry {
  if (military === 'airfield') return getOrCreate('ov-air', installationSidc('NEUTRAL', INSTALLATION_ENTITIES.AIR_BASE));
  if (military === 'naval_base') return getOrCreate('ov-naval', installationSidc('NEUTRAL', INSTALLATION_ENTITIES.NAVAL_BASE));
  return getOrCreate('ov-base', installationSidc('NEUTRAL', INSTALLATION_ENTITIES.ARMY_BASE));
}

export function getEonetIcon(category: string): IconEntry {
  if (category === 'Volcanoes' || category === 'VO') return getOrCreate('ev-volcano', EVENT_SIDCS.volcano);
  if (category === 'Wildfires' || category === 'WF') return getOrCreate('ev-wildfire', EVENT_SIDCS.wildfire);
  if (category === 'Earthquakes' || category === 'EQ') return getOrCreate('ev-earthquake', EVENT_SIDCS.earthquake);
  if (category === 'Floods' || category === 'FL') return getOrCreate('ev-flood', EVENT_SIDCS.flood);
  if (category === 'Severe Storms' || category === 'TC') return getOrCreate('ev-storm', EVENT_SIDCS.storm);
  if (category === 'Landslides') return getOrCreate('ev-landslide', EVENT_SIDCS.landslide);
  return getOrCreate('ev-default', EVENT_SIDCS.hotspot);
}

export function getUsgsIcon(): IconEntry {
  return getOrCreate('usgs-eq', EVENT_SIDCS.earthquake);
}

export function getPortIcon(port: { hasOilTerminal: boolean; hasLngTerminal: boolean; hasContainer: boolean }): IconEntry {
  let color = PORT_COLORS.default;
  let key = 'port-default';

  if (port.hasOilTerminal || port.hasLngTerminal) {
    color = PORT_COLORS.oil;
    key = 'port-oil';
  } else if (port.hasContainer) {
    color = PORT_COLORS.container;
    key = 'port-container';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <circle cx="32" cy="28" r="14" fill="${color}" stroke="white" stroke-width="3"/>
    <path d="M24 28 L32 16 L40 28" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M20 44 C26 38, 38 38, 44 44" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;

  return createSvgIcon(key, svg, 34);
}

// ─── Affiliation helpers ────────────────────────────────────

const FRIENDLY_COUNTRIES = new Set([
  'USA', 'UK', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands',
  'Israel', 'NATO', 'Australia', 'Canada', 'Saudi Arabia', 'UAE',
  'Qatar', 'Kuwait', 'India', 'Egypt',
]);

const HOSTILE_COUNTRIES = new Set(['Iran', 'Russia', 'Syria']);

export function getAircraftAffiliation(milCountry: string | null | undefined): string {
  if (!milCountry) return 'unknown';
  if (FRIENDLY_COUNTRIES.has(milCountry)) return 'friendly';
  if (HOSTILE_COUNTRIES.has(milCountry)) return 'hostile';
  return 'neutral';
}
