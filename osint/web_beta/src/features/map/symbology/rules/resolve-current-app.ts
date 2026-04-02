
import type {
  AisFeature,
  EonetFeature,
  FirmsFeature,
  GdeltFeature,
  OpenskyFeature,
  OverpassFeature,
  PortFeature,
  ReferenceFeature,
  UsgsFeature,
} from '@/features/map/types';

import { getCatalogEntry } from '../catalog/current-app-catalog';
import type { ResolutionResult, StandardIdentity, SymbolEntry } from '../types';

export type SymbolSubject =
  | { kind: 'reference'; feature: ReferenceFeature }
  | { kind: 'ais'; feature: AisFeature }
  | { kind: 'opensky'; feature: OpenskyFeature }
  | { kind: 'overpass'; feature: OverpassFeature }
  | { kind: 'port'; feature: PortFeature }
  | { kind: 'usgs'; feature: UsgsFeature }
  | { kind: 'eonet'; feature: EonetFeature }
  | { kind: 'gdelt'; feature: GdeltFeature }
  | { kind: 'firms'; feature: FirmsFeature };

function requireEntry(id: string): SymbolEntry {
  const entry = getCatalogEntry(id);
  if (!entry) {
    throw new Error(`Missing symbology catalog entry: ${id}`);
  }
  return entry;
}

function mapAffiliation(raw?: string | null): StandardIdentity {
  const value = String(raw ?? '').trim().toUpperCase();
  if (value === 'FRIENDLY') return 'friendly';
  if (value === 'HOSTILE') return 'hostile';
  if (value === 'NEUTRAL') return 'neutral';
  if (value === 'ASSUMED_FRIEND' || value === 'ASSUMEDFRIEND') return 'assumedFriend';
  return 'unknown';
}

function mapAircraftAffiliation(country?: string | null): StandardIdentity {
  const friendly = new Set([
    'USA', 'UK', 'FRANCE', 'GERMANY', 'ITALY', 'SPAIN', 'NETHERLANDS',
    'ISRAEL', 'NATO', 'AUSTRALIA', 'CANADA', 'SAUDI ARABIA', 'UAE',
    'QATAR', 'KUWAIT', 'INDIA', 'EGYPT',
  ]);
  const hostile = new Set(['IRAN', 'RUSSIA', 'SYRIA']);

  const value = String(country ?? '').trim().toUpperCase();
  if (!value) return 'unknown';
  if (friendly.has(value)) return 'friendly';
  if (hostile.has(value)) return 'hostile';
  return 'neutral';
}

function makeResult(
  entryId: string,
  identity: StandardIdentity,
  confidence: number,
  ruleId: string,
  title: string,
  detail: string,
  fallbackChain: string[],
): ResolutionResult {
  return {
    entry: requireEntry(entryId),
    identity,
    confidence,
    reason: { ruleId, title, detail },
    fallbackChain,
  };
}

function resolveReference(feature: ReferenceFeature): ResolutionResult {
  if (feature.featureKind === 'vessel') {
    const identity = mapAffiliation(feature.affiliation);
    const type = feature.type.toUpperCase();

    if (type === 'CARRIER') {
      return makeResult(
        'sea.surface.carrier',
        identity,
        0.98,
        'reference.vessel.carrier',
        'Reference vessel mapped as carrier',
        'Curated reference data explicitly classified this vessel as CARRIER.',
        ['reference.vessel', 'sea.surface.carrier'],
      );
    }

    if (type === 'DESTROYER') {
      return makeResult(
        'sea.surface.destroyer',
        identity,
        0.98,
        'reference.vessel.destroyer',
        'Reference vessel mapped as destroyer',
        'Curated reference data explicitly classified this vessel as DESTROYER.',
        ['reference.vessel', 'sea.surface.destroyer'],
      );
    }

    if (type === 'FRIGATE') {
      return makeResult(
        'sea.surface.frigate',
        identity,
        0.98,
        'reference.vessel.frigate',
        'Reference vessel mapped as frigate',
        'Curated reference data explicitly classified this vessel as FRIGATE.',
        ['reference.vessel', 'sea.surface.frigate'],
      );
    }

    if (type === 'AMPHIBIOUS') {
      return makeResult(
        'sea.surface.amphibious-warfare-ship',
        identity,
        0.96,
        'reference.vessel.amphibious',
        'Reference vessel mapped as amphibious warfare ship',
        'Curated reference data explicitly classified this vessel as AMPHIBIOUS.',
        ['reference.vessel', 'sea.surface.amphibious-warfare-ship'],
      );
    }

    if (type === 'SUBMARINE') {
      return makeResult(
        'sea.subsurface.submarine',
        identity,
        0.98,
        'reference.vessel.submarine',
        'Reference vessel mapped as submarine',
        'Curated reference data explicitly classified this vessel as SUBMARINE.',
        ['reference.vessel', 'sea.subsurface.submarine'],
      );
    }

    return makeResult(
      'sea.surface.military-combatant',
      identity,
      0.75,
      'reference.vessel.fallback.military-combatant',
      'Reference vessel fell back to generic military combatant',
      'The vessel is military/naval but its exact class does not have a dedicated rule yet.',
      ['reference.vessel', 'sea.surface.military-combatant'],
    );
  }

  const identity = mapAffiliation(feature.affiliation);
  const type = feature.type.toUpperCase();

  if (type === 'AIR_BASE') {
    return makeResult(
      'land.installation.air-base',
      identity,
      0.98,
      'reference.installation.air-base',
      'Reference installation mapped as air base',
      'Curated reference data explicitly classified this installation as AIR_BASE.',
      ['reference.installation', 'land.installation.air-base'],
    );
  }

  if (type === 'NAVAL_BASE') {
    return makeResult(
      'land.installation.naval-base',
      identity,
      0.98,
      'reference.installation.naval-base',
      'Reference installation mapped as naval base',
      'Curated reference data explicitly classified this installation as NAVAL_BASE.',
      ['reference.installation', 'land.installation.naval-base'],
    );
  }

  if (type === 'ARMY_BASE') {
    return makeResult(
      'land.installation.military-base',
      identity,
      0.95,
      'reference.installation.military-base',
      'Reference installation mapped as military base',
      'Curated reference data explicitly classified this installation as ARMY_BASE.',
      ['reference.installation', 'land.installation.military-base'],
    );
  }

  if (type === 'NUCLEAR_SITE') {
    return makeResult(
      'land.installation.nuclear-facility',
      identity,
      0.9,
      'reference.installation.nuclear-facility',
      'Reference installation mapped as nuclear facility',
      'Curated reference data explicitly classified this installation as NUCLEAR_SITE.',
      ['reference.installation', 'land.installation.nuclear-facility'],
    );
  }

  return makeResult(
    'land.installation.military-base',
    identity,
    0.6,
    'reference.installation.fallback.military-base',
    'Reference installation fell back to generic military base',
    'The installation type is military-related but currently lacks a dedicated mapping rule.',
    ['reference.installation', 'land.installation.military-base'],
  );
}

function resolveAis(feature: AisFeature): ResolutionResult {
  const shipType = feature.shipType ?? null;

  if (shipType === 35) {
    return makeResult(
      'sea.surface.military-combatant',
      'unknown',
      0.9,
      'ais.shiptype.35',
      'AIS ship type 35 mapped as military combatant',
      'AIS shipType 35 is commonly used for military vessels.',
      ['ais.shipType.35', 'sea.surface.military-combatant'],
    );
  }

  if (shipType != null && shipType >= 80 && shipType <= 89) {
    return makeResult(
      'sea.surface.oiler-tanker',
      'neutral',
      0.88,
      'ais.shiptype.80-89',
      'AIS tanker range mapped as tanker vessel',
      'AIS ship types 80-89 represent tanker classes.',
      ['ais.shipType.80-89', 'sea.surface.oiler-tanker'],
    );
  }

  if (shipType != null && shipType >= 70 && shipType <= 79) {
    return makeResult(
      'sea.surface.cargo-general',
      'neutral',
      0.88,
      'ais.shiptype.70-79',
      'AIS cargo range mapped as cargo vessel',
      'AIS ship types 70-79 represent cargo classes.',
      ['ais.shipType.70-79', 'sea.surface.cargo-general'],
    );
  }

  if (shipType != null && shipType >= 30 && shipType <= 39) {
    return makeResult(
      'sea.surface.fishing-vessel',
      'neutral',
      0.85,
      'ais.shiptype.30-39',
      'AIS fishing range mapped as fishing vessel',
      'AIS ship types 30-39 are typically fishing classes.',
      ['ais.shipType.30-39', 'sea.surface.fishing-vessel'],
    );
  }

  return makeResult(
    'sea.surface.merchant-ship',
    'neutral',
    0.55,
    'ais.fallback.merchant',
    'AIS vessel fell back to generic merchant ship',
    'The vessel is maritime traffic, but the AIS type does not resolve to a more specific icon yet.',
    ['ais', 'sea.surface.merchant-ship'],
  );
}

function resolveOpenSky(feature: OpenskyFeature): ResolutionResult {
  const identity = mapAircraftAffiliation(feature.milCountry);
  return makeResult(
    'air.fixed-wing.generic',
    identity,
    0.72,
    'opensky.generic-military-fixed-wing',
    'OpenSky military flight mapped as generic fixed-wing military aircraft',
    'The feed identifies the aircraft as military-related, but there is no reliable platform classification in the current dataset.',
    ['opensky', 'air.fixed-wing.generic'],
  );
}

function resolveOverpass(feature: OverpassFeature): ResolutionResult {
  const kind = String(feature.military ?? '').toLowerCase();

  if (kind === 'airfield') {
    return makeResult(
      'land.installation.air-base',
      'neutral',
      0.85,
      'overpass.airfield',
      'Overpass military=airfield mapped as air base',
      'The OSM military tag explicitly indicates an airfield.',
      ['overpass.military.airfield', 'land.installation.air-base'],
    );
  }

  if (kind === 'naval_base') {
    return makeResult(
      'land.installation.naval-base',
      'neutral',
      0.85,
      'overpass.naval-base',
      'Overpass military=naval_base mapped as naval base',
      'The OSM military tag explicitly indicates a naval base.',
      ['overpass.military.naval_base', 'land.installation.naval-base'],
    );
  }

  return makeResult(
    'land.installation.military-base',
    'neutral',
    0.65,
    'overpass.fallback.military-base',
    'Overpass feature fell back to generic military base',
    'The OSM feature is military-related but lacks a more specific resolved class.',
    ['overpass', 'land.installation.military-base'],
  );
}

function resolvePort(feature: PortFeature): ResolutionResult {
  if (feature.hasOilTerminal) {
    return makeResult(
      'land.installation.petroleum-facility',
      'neutral',
      0.8,
      'port.oil-terminal',
      'Port mapped as petroleum facility',
      'The port record indicates an oil terminal capability.',
      ['ports.hasOilTerminal', 'land.installation.petroleum-facility'],
    );
  }

  if (feature.hasLngTerminal) {
    return makeResult(
      'land.installation.natural-gas-facility',
      'neutral',
      0.8,
      'port.lng-terminal',
      'Port mapped as natural gas facility',
      'The port record indicates an LNG terminal capability.',
      ['ports.hasLngTerminal', 'land.installation.natural-gas-facility'],
    );
  }

  if (feature.hasContainer) {
    return makeResult(
      'land.installation.container-port',
      'neutral',
      0.7,
      'port.container',
      'Port mapped as container port',
      'The port record indicates container handling capability.',
      ['ports.hasContainer', 'land.installation.container-port'],
    );
  }

  return makeResult(
    'land.installation.commercial-port',
    'neutral',
    0.4,
    'port.fallback.commercial',
    'Port fell back to generic commercial port',
    'No specific terminal capability identified.',
    ['ports', 'land.installation.commercial-port'],
  );
}

function resolveUsgs(): ResolutionResult {
  return makeResult(
    'theme.earthquake',
    'unknown',
    1,
    'usgs.theme.earthquake',
    'USGS event mapped as thematic earthquake icon',
    'This is intentionally handled by the broader symbology system, not by a military platform symbol.',
    ['usgs', 'theme.earthquake'],
  );
}

function resolveEonet(feature: EonetFeature): ResolutionResult {
  const category = String(feature.category ?? '').toLowerCase();
  if (category.includes('wildfire') || category === 'wf') {
    return makeResult('theme.wildfire', 'unknown', 1, 'eonet.theme.wildfire',
      'EONET wildfire mapped as thematic wildfire icon',
      'This is a natural-hazard event.', ['eonet', 'theme.wildfire']);
  }

  if (category.includes('earthquake') || category === 'eq') {
    return makeResult('theme.earthquake', 'unknown', 1, 'eonet.theme.earthquake',
      'EONET earthquake mapped as thematic earthquake icon',
      'This is a natural-hazard event.', ['eonet', 'theme.earthquake']);
  }

  if (category.includes('volcano') || category === 'vo') {
    return makeResult('theme.volcano', 'unknown', 1, 'eonet.theme.volcano',
      'EONET volcano mapped as thematic volcano icon',
      'This is a natural-hazard event.', ['eonet', 'theme.volcano']);
  }

  if (category.includes('flood') || category === 'fl') {
    return makeResult('theme.flood', 'unknown', 1, 'eonet.theme.flood',
      'EONET flood mapped as thematic flood icon',
      'This is a natural-hazard event.', ['eonet', 'theme.flood']);
  }

  if (category.includes('severe storm') || category.includes('storm') || category === 'tc') {
    return makeResult('theme.storm', 'unknown', 1, 'eonet.theme.storm',
      'EONET storm mapped as thematic storm icon',
      'This is a natural-hazard event.', ['eonet', 'theme.storm']);
  }

  if (category.includes('landslide')) {
    return makeResult('theme.landslide', 'unknown', 1, 'eonet.theme.landslide',
      'EONET landslide mapped as thematic landslide icon',
      'This is a natural-hazard event.', ['eonet', 'theme.landslide']);
  }

  return makeResult('theme.earthquake', 'unknown', 0.35, 'eonet.fallback.generic-event',
    'EONET event fell back to generic natural event icon',
    'The current catalog does not yet include a dedicated thematic icon for this event category.',
    ['eonet', 'theme.earthquake']);
}

function resolveGdelt(): ResolutionResult {
  return makeResult(
    'theme.conflict-event',
    'unknown',
    1,
    'gdelt.theme.conflict-event',
    'GDELT item mapped as thematic conflict-event icon',
    'GDELT points are abstract conflict events, not platforms or installations, so a thematic event icon is clearer than a military unit icon.',
    ['gdelt', 'theme.conflict-event'],
  );
}

function resolveFirms(): ResolutionResult {
  return makeResult(
    'theme.wildfire',
    'unknown',
    1,
    'firms.theme.wildfire',
    'FIRMS hotspot mapped as thermal/wildfire icon',
    'FIRMS detections are thermal events rather than military platforms.',
    ['firms', 'theme.wildfire'],
  );
}

export function resolveCurrentAppSymbol(subject: SymbolSubject): ResolutionResult {
  switch (subject.kind) {
    case 'reference':
      return resolveReference(subject.feature);
    case 'ais':
      return resolveAis(subject.feature);
    case 'opensky':
      return resolveOpenSky(subject.feature);
    case 'overpass':
      return resolveOverpass(subject.feature);
    case 'port':
      return resolvePort(subject.feature);
    case 'usgs':
      return resolveUsgs();
    case 'eonet':
      return resolveEonet(subject.feature);
    case 'gdelt':
      return resolveGdelt();
    case 'firms':
      return resolveFirms();
    default: {
      const _never: never = subject;
      throw new Error(`Unhandled subject: ${String(_never)}`);
    }
  }
}
