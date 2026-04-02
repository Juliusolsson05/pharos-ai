import {
  getInstallationIcon,
  getVesselIcon,
} from '@/features/map/lib/icons';
import type {
  AisFeature,
  EonetFeature,
  OverpassFeature,
  ReferenceFeature,
} from '@/features/map/types';

// ─── Position / classification helpers ──────────────────────

export function referencePosition(item: ReferenceFeature): [number, number] | null {
  if (item.featureKind === 'vessel') {
    return item.typicalPatrolLat != null && item.typicalPatrolLon != null
      ? [item.typicalPatrolLon, item.typicalPatrolLat]
      : null;
  }
  return item.lat != null && item.lon != null ? [item.lon, item.lat] : null;
}

export function classifyVessel(d: AisFeature): string {
  if (d.shipType === 35) return 'MILITARY';
  return 'neutral';
}

function getReferenceVesselClass(item: ReferenceFeature) {
  const type = item.type.toUpperCase();
  if (type === 'CARRIER' || type === 'AMPHIBIOUS' || type === 'DESTROYER') {
    return 'MILITARY';
  }
  return 'neutral';
}

export function getReferenceIcon(item: ReferenceFeature) {
  if (item.featureKind === 'vessel') {
    return getVesselIcon(35, getReferenceVesselClass(item));
  }
  return getInstallationIcon(item.type, item.affiliation);
}

export function getReferenceIconSize(item: ReferenceFeature) {
  if (item.featureKind === 'vessel') {
    const name = item.name.toUpperCase();
    const type = item.type.toUpperCase();
    const displacement = item.displacement ?? 0;

    if (name.includes('ABRAHAM LINCOLN') || name.includes('HARRY S. TRUMAN') || name.includes('CHARLES DE GAULLE')) {
      return 24;
    }
    if (type === 'CARRIER') return 22;
    if (type === 'AMPHIBIOUS') return 18;
    if (type === 'DESTROYER') return 15;
    if (item.airWing || item.strikeGroup) return 18;
    if (displacement >= 80000) return 22;
    if (displacement >= 30000) return 18;
    if (displacement >= 9000) return 15;
    return 13;
  }
  if (item.type === 'NUCLEAR_SITE' || item.type === 'LAUNCH_ZONE') return 24;
  if (item.type === 'AIR_BASE' || item.type === 'NAVAL_BASE') return 22;
  if (item.type === 'COMMAND') return 20;
  return 18;
}

export function getOverpassIconSize(item: OverpassFeature) {
  if (item.military === 'airfield' || item.military === 'naval_base') return 18;
  return 16;
}

export function getEventIconSize(item: EonetFeature) {
  if (item.category === 'Volcanoes' || item.category === 'VO') return 18;
  if (item.category === 'Severe Storms' || item.category === 'TC') return 17;
  if (item.category === 'Floods' || item.category === 'FL') return 17;
  if (item.category === 'Earthquakes' || item.category === 'EQ') return 15;
  return 14;
}

// ─── Icon prop constants ────────────────────────────────────

export const MOBILE_ICON_PROPS = {
  sizeScale: 1,
  sizeUnits: 'pixels' as const,
  sizeMinPixels: 4,
  sizeMaxPixels: 18,
  billboard: false,
};

export const SITE_ICON_PROPS = {
  sizeScale: 1,
  sizeUnits: 'pixels' as const,
  sizeMinPixels: 10,
  sizeMaxPixels: 36,
  billboard: false,
};

export const EVENT_ICON_PROPS = {
  sizeScale: 1,
  sizeUnits: 'pixels' as const,
  sizeMinPixels: 9,
  sizeMaxPixels: 28,
  billboard: false,
};

export const PORT_ICON_PROPS = {
  sizeScale: 1,
  sizeUnits: 'pixels' as const,
  sizeMinPixels: 8,
  sizeMaxPixels: 24,
  billboard: false,
};

// ─── Zoom multiplier ────────────────────────────────────────

export function getZoomMultiplier(zoom: number, kind: 'mobile' | 'site' | 'event' | 'port') {
  if (kind === 'mobile') {
    if (zoom >= 10) return 2.4;
    if (zoom >= 8) return 2.0;
    if (zoom >= 6) return 1.6;
    if (zoom >= 4) return 1.25;
    return 1;
  }
  if (kind === 'site') {
    if (zoom >= 10) return 1.6;
    if (zoom >= 8) return 1.35;
    if (zoom >= 6) return 1.15;
    return 1;
  }
  if (kind === 'event') {
    if (zoom >= 10) return 1.45;
    if (zoom >= 8) return 1.25;
    if (zoom >= 6) return 1.1;
    return 1;
  }
  if (zoom >= 10) return 1.35;
  if (zoom >= 8) return 1.2;
  return 1;
}
