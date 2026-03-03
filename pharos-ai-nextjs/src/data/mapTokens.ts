/**
 * mapTokens.ts
 * Single source of truth for the map hierarchy system.
 *
 * Rule: hex literals only appear here (in RGB tuples for deck.gl).
 * Component files always reference `cssVar` via var(--token).
 */

// ─── Level 1: Actor ───────────────────────────────────────────────────────────

export type ActorKey = string;
export type Affiliation = 'FRIENDLY' | 'HOSTILE';

export type ActorMeta = {
  label: string;
  cssVar: string;                    // CSS variable — used in React components
  rgb: [number, number, number];     // Raw RGB — used in deck.gl layer accessors
  affiliation: Affiliation;
  group: string;
};

export const ACTOR_META: Record<string, ActorMeta> = {
  US:        { label: 'United States', cssVar: 'var(--blue)',    rgb: [45,  114, 210], affiliation: 'FRIENDLY', group: 'Coalition' },
  ISRAEL:    { label: 'Israel (IDF)',  cssVar: 'var(--teal)',    rgb: [50,  200, 200], affiliation: 'FRIENDLY', group: 'Coalition' },
  NATO:      { label: 'NATO',          cssVar: 'var(--cyber)',   rgb: [160, 100, 220], affiliation: 'FRIENDLY', group: 'Coalition' },
  IRAN:      { label: 'Iran',          cssVar: 'var(--danger)',  rgb: [231, 106, 110], affiliation: 'HOSTILE',  group: 'Adversary' },
  IRGC:      { label: 'IRGC',         cssVar: 'var(--danger)',  rgb: [200,  50,  50], affiliation: 'HOSTILE',  group: 'Adversary' },
  HOUTHI:    { label: 'Houthi',        cssVar: 'var(--warning)', rgb: [236, 154,  60], affiliation: 'HOSTILE',  group: 'Adversary' },
  HEZBOLLAH: { label: 'Hezbollah',     cssVar: 'var(--danger)',  rgb: [180,  40,  40], affiliation: 'HOSTILE',  group: 'Adversary' },
  PMF:       { label: 'Iraqi PMF',     cssVar: 'var(--warning)', rgb: [200, 120,  40], affiliation: 'HOSTILE',  group: 'Adversary' },
};

// ─── Level 2: Category ────────────────────────────────────────────────────────

export type MarkerCategory = 'KINETIC' | 'INSTALLATION' | 'ZONE';

export const CATEGORY_LABEL: Record<MarkerCategory, string> = {
  KINETIC:      'Kinetic',
  INSTALLATION: 'Installation',
  ZONE:         'Zone',
};

export const ALL_CATEGORIES: MarkerCategory[] = ['KINETIC', 'INSTALLATION', 'ZONE'];

// ─── Level 3: Type (within category) ─────────────────────────────────────────

export type KineticType      = 'AIRSTRIKE' | 'NAVAL_STRIKE' | 'BALLISTIC' | 'CRUISE' | 'DRONE';
export type InstallationType = 'CARRIER' | 'AIR_BASE' | 'NAVAL_BASE' | 'ARMY_BASE' | 'NUCLEAR_SITE' | 'COMMAND' | 'INFRASTRUCTURE';
export type ZoneType         = 'CLOSURE' | 'PATROL' | 'NFZ' | 'THREAT_CORRIDOR';

export type MarkerType = KineticType | InstallationType | ZoneType;

export const TYPE_META: Record<string, { label: string; category: MarkerCategory }> = {
  AIRSTRIKE:        { label: 'Airstrike',        category: 'KINETIC' },
  NAVAL_STRIKE:     { label: 'Naval Strike',     category: 'KINETIC' },
  BALLISTIC:        { label: 'Ballistic',        category: 'KINETIC' },
  CRUISE:           { label: 'Cruise',           category: 'KINETIC' },
  DRONE:            { label: 'Drone',            category: 'KINETIC' },
  CARRIER:          { label: 'Carrier',          category: 'INSTALLATION' },
  AIR_BASE:         { label: 'Air Base',         category: 'INSTALLATION' },
  NAVAL_BASE:       { label: 'Naval Base',       category: 'INSTALLATION' },
  ARMY_BASE:        { label: 'Army Base',        category: 'INSTALLATION' },
  NUCLEAR_SITE:     { label: 'Nuclear Site',     category: 'INSTALLATION' },
  COMMAND:          { label: 'Command',          category: 'INSTALLATION' },
  INFRASTRUCTURE:   { label: 'Infrastructure',   category: 'INSTALLATION' },
  CLOSURE:          { label: 'Closure',          category: 'ZONE' },
  PATROL:           { label: 'Patrol',           category: 'ZONE' },
  NFZ:              { label: 'NFZ',              category: 'ZONE' },
  THREAT_CORRIDOR:  { label: 'Threat Corridor',  category: 'ZONE' },
};

// Naval strikes use teal regardless of actor (visual convention: teal = maritime)
export const NAVAL_RGB: [number, number, number] = [50, 200, 200];

// ─── Level 4: Status ──────────────────────────────────────────────────────────

export type KineticStatus      = 'COMPLETE' | 'INTERCEPTED' | 'IMPACTED';
export type InstallationStatus = 'ACTIVE' | 'DEGRADED' | 'STRUCK' | 'DAMAGED' | 'DESTROYED';
export type MarkerStatus       = KineticStatus | InstallationStatus;

type StatusMeta = { label: string; cssVar: string };

export const STATUS_META: Record<MarkerStatus, StatusMeta> = {
  ACTIVE:      { label: 'Active',      cssVar: 'var(--success)' },
  DEGRADED:    { label: 'Degraded',    cssVar: 'var(--warning)' },
  STRUCK:      { label: 'Struck',      cssVar: 'var(--warning)' },
  DAMAGED:     { label: 'Damaged',     cssVar: 'var(--warning)' },
  DESTROYED:   { label: 'Destroyed',   cssVar: 'var(--danger)'  },
  INTERCEPTED: { label: 'Intercepted', cssVar: 'var(--info)'    },
  IMPACTED:    { label: 'Impacted',    cssVar: 'var(--danger)'  },
  COMPLETE:    { label: 'Complete',    cssVar: 'var(--t3)'      },
};

export const KINETIC_STATUSES:      KineticStatus[]      = ['COMPLETE', 'INTERCEPTED', 'IMPACTED'];
export const INSTALLATION_STATUSES: InstallationStatus[] = ['ACTIVE', 'DEGRADED', 'STRUCK', 'DAMAGED', 'DESTROYED'];
export const ALL_STATUSES:          MarkerStatus[]       = [...KINETIC_STATUSES, ...INSTALLATION_STATUSES];

// ─── Level 0: Priority ────────────────────────────────────────────────────────
// Assigned per-record based on strategic importance, not just severity.

export type Priority = 'P1' | 'P2' | 'P3';

type PriorityMeta = { label: string; description: string; cssVar: string; rgb: [number, number, number] };

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  P1: { label: 'P1',  description: 'Critical — changes the war',         cssVar: 'var(--danger)',  rgb: [231, 106, 110] },
  P2: { label: 'P2',  description: 'Major — significant battlefield impact', cssVar: 'var(--warning)', rgb: [236, 154,  60] },
  P3: { label: 'P3',  description: 'Standard — background / peripheral', cssVar: 'var(--t3)',      rgb: [143, 153, 168] },
};

export const ALL_PRIORITIES: Priority[] = ['P1', 'P2', 'P3'];

// ─── Layer display config (drives the top-right filter row) ──────────────────

export type LayerDisplayMeta = {
  color:  string;   // active text color  (CSS var)
  border: string;   // active border color (CSS var)
  bg:     string;   // active bg color     (CSS var)
};

// Order matches ALL_LAYERS in use-map-filters.ts
export const LAYER_DISPLAY: Record<string, LayerDisplayMeta> = {
  strikes:  { color: 'var(--blue-l)',  border: 'var(--blue)',    bg: 'var(--blue-dim)'  },
  missiles: { color: 'var(--danger)',  border: 'var(--danger)',  bg: 'var(--danger-dim)'},
  targets:  { color: 'var(--warning)', border: 'var(--warning)', bg: 'var(--warning-dim)'},
  assets:   { color: 'var(--teal)',    border: 'var(--teal)',    bg: 'var(--teal-dim)'  },
  zones:    { color: 'var(--gold)',    border: 'var(--gold)',    bg: 'var(--gold-dim)'  },
  heat:     { color: 'var(--cyber)',   border: 'var(--cyber)',   bg: 'var(--cyber-dim)' },
};
