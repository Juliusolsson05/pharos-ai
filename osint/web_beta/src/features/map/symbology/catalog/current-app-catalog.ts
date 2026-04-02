
import type { SymbolEntry } from '../types';

/**
 * This is a deliberately small seed catalog covering the symbol concepts
 * already used by your current app. The long-term plan is to generate a much
 * larger normalized catalog from `mil-std-2525` (or another maintained source
 * of truth) at build time, but this file is immediately usable today.
 */
export const CURRENT_APP_SYMBOL_CATALOG: SymbolEntry[] = [
  {
    id: 'air.fixed-wing.generic',
    symbolSet: 'air',
    label: 'Fixed Wing',
    plainLabel: 'Generic military fixed-wing aircraft',
    description:
      'Use when the source tells us it is a military aircraft but does not give a reliable platform class.',
    keywords: ['air', 'aircraft', 'fixed wing', 'military', 'opensky', 'flight'],
    aliases: ['generic aircraft', 'military plane'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '01',
        entityCode: '11',
        entityTypeCode: '01',
      },
      defaultIdentity: 'unknown',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
      render: {
        frame: true,
        icon: true,
        fill: true,
      },
    },
  },
  {
    id: 'sea.surface.military-combatant',
    symbolSet: 'sea-surface',
    label: 'Military Combatant',
    plainLabel: 'Generic military surface vessel',
    description:
      'Use when a vessel is military but the exact class is not known with confidence.',
    keywords: ['sea', 'surface', 'warship', 'combatant', 'vessel', 'ais'],
    aliases: ['generic warship'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '30',
        entityCode: '12',
      },
      defaultIdentity: 'unknown',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'sea.surface.carrier',
    symbolSet: 'sea-surface',
    label: 'Carrier',
    plainLabel: 'Aircraft carrier',
    description: 'Use for carriers in curated reference data and other highly trusted datasets.',
    keywords: ['carrier', 'cv', 'cvn', 'warship', 'sea'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '30',
        entityCode: '12',
        entityTypeCode: '01',
      },
      defaultIdentity: 'friendly',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'sea.surface.destroyer',
    symbolSet: 'sea-surface',
    label: 'Destroyer',
    plainLabel: 'Destroyer',
    description: 'Use for destroyer-class military surface combatants.',
    keywords: ['destroyer', 'ddg', 'warship', 'sea'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '30',
        entityCode: '12',
        entityTypeCode: '02',
        entitySubtypeCode: '03',
      },
      defaultIdentity: 'friendly',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'sea.surface.frigate',
    symbolSet: 'sea-surface',
    label: 'Frigate',
    plainLabel: 'Frigate',
    description: 'Use for frigate-class military surface combatants.',
    keywords: ['frigate', 'warship', 'sea'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '30',
        entityCode: '12',
        entityTypeCode: '02',
        entitySubtypeCode: '04',
      },
      defaultIdentity: 'friendly',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'sea.surface.amphibious-warfare-ship',
    symbolSet: 'sea-surface',
    label: 'Amphibious Warfare Ship',
    plainLabel: 'Amphibious warfare ship',
    description: 'Use for amphibious assault and related expeditionary warfare ships.',
    keywords: ['amphibious', 'lha', 'lhd', 'lpd', 'warship', 'sea'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '30',
        entityCode: '12',
        entityTypeCode: '03',
      },
      defaultIdentity: 'friendly',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'sea.subsurface.submarine',
    symbolSet: 'sea-subsurface',
    label: 'Submarine',
    plainLabel: 'Submarine',
    description: 'Use for submarine-class naval platforms.',
    keywords: ['submarine', 'ssn', 'ssk', 'ssbn', 'sea', 'subsurface'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '35',
        entityCode: '11',
      },
      defaultIdentity: 'friendly',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'sea.surface.merchant-ship',
    symbolSet: 'sea-surface',
    label: 'Merchant Ship',
    plainLabel: 'Generic commercial vessel',
    description: 'Use when an AIS vessel is commercial but class detail is unknown or weak.',
    keywords: ['merchant', 'commercial', 'sea', 'ais', 'ship'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '30',
        entityCode: '14',
        entityTypeCode: '01',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['neutral', 'unknown'],
    },
  },
  {
    id: 'sea.surface.cargo-general',
    symbolSet: 'sea-surface',
    label: 'Cargo, General',
    plainLabel: 'Cargo vessel',
    description: 'Use for general cargo shipping classes.',
    keywords: ['cargo', 'freighter', 'merchant', 'sea', 'ais'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '30',
        entityCode: '14',
        entityTypeCode: '01',
        entitySubtypeCode: '01',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['neutral', 'unknown'],
    },
  },
  {
    id: 'sea.surface.oiler-tanker',
    symbolSet: 'sea-surface',
    label: 'Oiler/Tanker',
    plainLabel: 'Tanker vessel',
    description: 'Use for tanker and oiler commercial shipping classes.',
    keywords: ['tanker', 'oiler', 'merchant', 'sea', 'ais'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '30',
        entityCode: '14',
        entityTypeCode: '01',
        entitySubtypeCode: '09',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['neutral', 'unknown'],
    },
  },
  {
    id: 'sea.surface.fishing-vessel',
    symbolSet: 'sea-surface',
    label: 'Fishing Vessel',
    plainLabel: 'Fishing vessel',
    description: 'Use for fishing-class AIS traffic.',
    keywords: ['fishing', 'trawler', 'ais', 'sea'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '30',
        entityCode: '14',
        entityTypeCode: '02',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['neutral', 'unknown'],
    },
  },
  {
    id: 'land.installation.air-base',
    symbolSet: 'land-installation',
    label: 'Airport/Air Base',
    plainLabel: 'Air base',
    description: 'Use for military air bases, airfields, and airport-like military installations.',
    keywords: ['air base', 'airfield', 'airport', 'installation', 'overpass', 'reference'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '20',
        entityCode: '12',
        entityTypeCode: '13',
        entitySubtypeCode: '01',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'land.installation.naval-base',
    symbolSet: 'land-installation',
    label: 'Sea Port/Naval Base',
    plainLabel: 'Naval base',
    description: 'Use for naval bases and port-side military maritime facilities.',
    keywords: ['naval base', 'seaport', 'navy', 'installation', 'port'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '20',
        entityCode: '12',
        entityTypeCode: '13',
        entitySubtypeCode: '09',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'land.installation.military-base',
    symbolSet: 'land-installation',
    label: 'Military Base',
    plainLabel: 'Military base',
    description: 'Use as the generic military-installation fallback when a more specific site type is unknown.',
    keywords: ['military base', 'base', 'installation', 'garrison'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '20',
        entityCode: '12',
        entityTypeCode: '08',
        entitySubtypeCode: '02',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'land.installation.nuclear-facility',
    symbolSet: 'land-installation',
    label: 'Nuclear (Non CBRN Defense)',
    plainLabel: 'Nuclear facility',
    description: 'Use for nuclear energy or strategic nuclear infrastructure where the dataset semantics are infrastructure, not an active launch or event.',
    keywords: ['nuclear', 'facility', 'installation', 'energy'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '20',
        entityCode: '11',
        entityTypeCode: '15',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'land.installation.natural-gas-facility',
    symbolSet: 'land-installation',
    label: 'Natural Gas Facility',
    plainLabel: 'Natural gas facility',
    description: 'Useful for LNG or gas-terminal oriented infrastructure symbols.',
    keywords: ['lng', 'gas', 'terminal', 'port', 'energy', 'infrastructure'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '20',
        entityCode: '12',
        entityTypeCode: '05',
        entitySubtypeCode: '03',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'land.installation.petroleum-facility',
    symbolSet: 'land-installation',
    label: 'Petroleum Facility',
    plainLabel: 'Petroleum or oil terminal',
    description: 'Useful for oil terminals or petroleum infrastructure.',
    keywords: ['oil', 'petroleum', 'terminal', 'port', 'energy', 'infrastructure'],
    definition: {
      kind: 'milsymbol',
      code: {
        symbolSetCode: '20',
        entityCode: '12',
        entityTypeCode: '05',
        entitySubtypeCode: '04',
      },
      defaultIdentity: 'neutral',
      supportedIdentities: ['friendly', 'neutral', 'hostile', 'unknown'],
    },
  },
  {
    id: 'land.installation.container-port',
    symbolSet: 'land-installation',
    label: 'Container Port',
    plainLabel: 'Container port',
    description: 'A commercial port with container handling capability.',
    keywords: ['container', 'port', 'commercial', 'shipping'],
    definition: {
      kind: 'svg', width: 64, height: 64, anchorX: 32, anchorY: 32,
      svg: (accent) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="28" r="14" fill="${accent}" stroke="white" stroke-width="3"/>
          <rect x="26" y="22" width="12" height="12" rx="1" fill="none" stroke="white" stroke-width="2.5"/>
          <path d="M20 44 C26 38, 38 38, 44 44" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
        </svg>`,
    },
  },
  {
    id: 'land.installation.commercial-port',
    symbolSet: 'land-installation',
    label: 'Commercial Port',
    plainLabel: 'Generic commercial port',
    description: 'A generic commercial port without specific terminal classification.',
    keywords: ['port', 'harbor', 'commercial', 'generic'],
    definition: {
      kind: 'svg', width: 64, height: 64, anchorX: 32, anchorY: 34,
      svg: (accent) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="28" r="14" fill="${accent}" stroke="white" stroke-width="3"/>
          <path d="M24 28 L32 16 L40 28" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M20 44 C26 38, 38 38, 44 44" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
        </svg>`,
    },
  },
  {
    id: 'theme.earthquake',
    symbolSet: 'theme',
    label: 'Earthquake',
    plainLabel: 'Earthquake',
    description:
      'A non-military thematic icon. This belongs in the symbology system, but not in the military-standard subset.',
    keywords: ['earthquake', 'usgs', 'eonet', 'hazard'],
    definition: {
      kind: 'svg',
      width: 64,
      height: 64,
      anchorX: 32,
      anchorY: 32,
      svg: (accent) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="18" fill="${accent}" stroke="white" stroke-width="4"/>
          <path d="M20 34h8l4-10 4 16 4-8h8" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,
    },
  },
  {
    id: 'theme.wildfire',
    symbolSet: 'theme',
    label: 'Wildfire',
    plainLabel: 'Wildfire or thermal anomaly',
    description:
      'A non-military thematic icon for wildfire and heat events such as FIRMS or EONET wildfire data.',
    keywords: ['wildfire', 'firms', 'heat', 'thermal', 'fire'],
    definition: {
      kind: 'svg',
      width: 64,
      height: 64,
      anchorX: 32,
      anchorY: 32,
      svg: (accent) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <path d="M32 10c5 8 11 13 11 22 0 8-5 16-11 16s-11-8-11-16c0-6 3-11 7-16 0 6 4 7 4 13 4-4 5-9 0-19z"
                fill="${accent}" stroke="white" stroke-width="3" stroke-linejoin="round"/>
        </svg>
      `,
    },
  },
  {
    id: 'theme.volcano',
    symbolSet: 'theme',
    label: 'Volcano',
    plainLabel: 'Volcanic eruption',
    description: 'A non-military thematic icon for volcanic events from EONET.',
    keywords: ['volcano', 'eruption', 'eonet', 'hazard'],
    definition: {
      kind: 'svg', width: 64, height: 64, anchorX: 32, anchorY: 32,
      svg: (accent) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <path d="M32 12L14 50h36L32 12z" fill="${accent}" stroke="white" stroke-width="4" stroke-linejoin="round"/>
          <circle cx="32" cy="26" r="4" fill="white"/>
        </svg>`,
    },
  },
  {
    id: 'theme.flood',
    symbolSet: 'theme',
    label: 'Flood',
    plainLabel: 'Flood event',
    description: 'A non-military thematic icon for flood events from EONET.',
    keywords: ['flood', 'water', 'eonet', 'hazard'],
    definition: {
      kind: 'svg', width: 64, height: 64, anchorX: 32, anchorY: 32,
      svg: (accent) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="18" fill="${accent}" stroke="white" stroke-width="4"/>
          <path d="M16 34c4-4 8-4 12 0 4-4 8-4 12 0 4-4 8-4 12 0" stroke="white" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        </svg>`,
    },
  },
  {
    id: 'theme.storm',
    symbolSet: 'theme',
    label: 'Storm',
    plainLabel: 'Severe storm or cyclone',
    description: 'A non-military thematic icon for severe storm events from EONET.',
    keywords: ['storm', 'cyclone', 'hurricane', 'eonet', 'hazard'],
    definition: {
      kind: 'svg', width: 64, height: 64, anchorX: 32, anchorY: 32,
      svg: (accent) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="18" fill="${accent}" stroke="white" stroke-width="4"/>
          <path d="M38 20L26 32h12L24 44" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
    },
  },
  {
    id: 'theme.landslide',
    symbolSet: 'theme',
    label: 'Landslide',
    plainLabel: 'Landslide',
    description: 'A non-military thematic icon for landslide events from EONET.',
    keywords: ['landslide', 'rockslide', 'eonet', 'hazard'],
    definition: {
      kind: 'svg', width: 64, height: 64, anchorX: 32, anchorY: 32,
      svg: (accent) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <path d="M14 50L32 16l18 34H14z" fill="${accent}" stroke="white" stroke-width="4" stroke-linejoin="round"/>
          <path d="M26 38l6-10 6 10" stroke="white" stroke-width="3" fill="none" stroke-linejoin="round"/>
        </svg>`,
    },
  },
  {
    id: 'theme.conflict-event',
    symbolSet: 'theme',
    label: 'Conflict Event',
    plainLabel: 'Conflict or strike event',
    description:
      'A non-military thematic icon for abstract event points like GDELT conflict items where a platform symbol would be misleading.',
    keywords: ['gdelt', 'strike', 'conflict', 'event'],
    definition: {
      kind: 'svg',
      width: 64,
      height: 64,
      anchorX: 32,
      anchorY: 32,
      svg: (accent) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="18" fill="${accent}" stroke="white" stroke-width="4"/>
          <path d="M24 24l16 16M40 24L24 40" stroke="white" stroke-width="4" stroke-linecap="round"/>
        </svg>
      `,
    },
  },
];

export function getCatalogEntry(id: string) {
  return CURRENT_APP_SYMBOL_CATALOG.find((entry) => entry.id === id);
}
