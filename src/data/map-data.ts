import type {
  ActorKey,
  InstallationStatus,
  InstallationType,
  KineticStatus,
  KineticType,
  MarkerCategory,
  Priority,
  ZoneType,
} from './map-tokens';

export type { ActorKey };

export type StrikeArc = {
  id:        string;
  sourceEventId?: string | null;
  actor:     ActorKey;
  priority:  Priority;
  category:  Extract<MarkerCategory, 'KINETIC'>;
  type:      Extract<KineticType, 'AIRSTRIKE' | 'NAVAL_STRIKE'>;
  status:    Extract<KineticStatus, 'COMPLETE'>;
  timestamp: string;
  from:      [number, number];
  to:        [number, number];
  label:     string;
  severity:  'CRITICAL' | 'HIGH';
};

export type MissileTrack = {
  id:        string;
  sourceEventId?: string | null;
  actor:     ActorKey;
  priority:  Priority;
  category:  Extract<MarkerCategory, 'KINETIC'>;
  type:      Extract<KineticType, 'BALLISTIC' | 'CRUISE' | 'DRONE'>;
  status:    Extract<KineticStatus, 'INTERCEPTED' | 'IMPACTED'>;
  timestamp: string;
  from:      [number, number];
  to:        [number, number];
  label:     string;
  severity:  'CRITICAL' | 'HIGH';
};

export type Target = {
  id:          string;
  sourceEventId?: string | null;
  actor:       ActorKey;
  priority:    Priority;
  category:    Extract<MarkerCategory, 'INSTALLATION'>;
  type:        InstallationType;
  status:      InstallationStatus;
  timestamp:   string;
  name:        string;
  position:    [number, number];
  description: string;
};

export type Asset = {
  id:          string;
  sourceEventId?: string | null;
  actor:       ActorKey;
  priority:    Priority;
  category:    Extract<MarkerCategory, 'INSTALLATION'>;
  type:        Extract<InstallationType, 'CARRIER' | 'AIR_BASE' | 'NAVAL_BASE' | 'ARMY_BASE'>;
  status:      InstallationStatus;
  timestamp?:  string;
  name:        string;
  position:    [number, number];
  description?: string;
};

export type ThreatZone = {
  id:          string;
  sourceEventId?: string | null;
  actor:       ActorKey;
  priority:    Priority;
  category:    Extract<MarkerCategory, 'ZONE'>;
  type:        ZoneType;
  timestamp?:  string;
  name:        string;
  coordinates: [number, number][];
  color:       [number, number, number, number];
};

export type HeatPoint = {
  id:             string;
  sourceEventId?: string | null;
  actor:          string;
  priority:       string;
  position:       [number, number];
  weight:         number;
};
