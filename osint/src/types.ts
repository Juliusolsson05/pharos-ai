// Raw row parsed from GDELT 2.0 export CSV
export type GdeltRow = {
  globalEventId: string;
  day: string;
  actor1Name: string;
  actor2Name: string;
  eventCode: string;
  numMentions: number;
  avgTone: number;
  countryCode: string;
  lat: number;
  lon: number;
  sourceUrl: string;
  raw: string[]; // all 61 columns preserved
};

// Map data response — matches main app's MapDataResponse shape
export type MapDataResponse = {
  strikes: StrikeArc[];
  missiles: never[];
  targets: never[];
  assets: Asset[];
  threatZones: ThreatZone[];
  heatPoints: HeatPoint[];
  actorMeta: Record<string, ActorMeta>;
};

export type StrikeArc = {
  id: string;
  sourceEventId: string | null;
  actor: string;
  priority: 'P1' | 'P2' | 'P3';
  category: 'KINETIC';
  type: 'AIRSTRIKE' | 'NAVAL_STRIKE';
  status: 'COMPLETE';
  timestamp: string;
  from: [number, number];
  to: [number, number];
  label: string;
  severity: 'CRITICAL' | 'HIGH';
};

export type Asset = {
  id: string;
  sourceEventId: string | null;
  actor: string;
  priority: 'P1' | 'P2' | 'P3';
  category: 'INSTALLATION';
  type: 'AIR_BASE' | 'NAVAL_BASE' | 'ARMY_BASE' | 'CARRIER';
  status: 'ACTIVE' | 'DEGRADED' | 'STRUCK' | 'DAMAGED' | 'DESTROYED';
  name: string;
  position: [number, number];
  description?: string;
};

export type ThreatZone = {
  id: string;
  sourceEventId: string | null;
  actor: string;
  priority: 'P1' | 'P2' | 'P3';
  category: 'ZONE';
  type: 'CLOSURE' | 'PATROL' | 'NFZ' | 'THREAT_CORRIDOR';
  name: string;
  coordinates: [number, number][];
  color: [number, number, number, number];
};

export type HeatPoint = {
  id: string;
  sourceEventId: string | null;
  actor: string;
  priority: string;
  position: [number, number];
  weight: number;
};

export type ActorMeta = {
  label: string;
  cssVar: string;
  rgb: number[];
  affiliation: 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL';
  group: string;
};
