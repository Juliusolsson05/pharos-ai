import { NextRequest } from 'next/server';

import { err, ok, parseQueryArray } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { normalizeKineticGeometry, normalizePointGeometry, normalizePolygonGeometry } from '@/server/lib/map-feature-geometry';

import { MapFeatureType } from '@/generated/prisma/enums';

const VALID_FEATURE_TYPES = Object.values(MapFeatureType) as string[];

const DEFAULT_ZONE_COLOR: [number, number, number, number] = [255, 69, 0, 120];

/** Normalize a color value from any LLM-produced format into an RGBA tuple. */
function normalizeColor(raw: unknown): [number, number, number, number] {
  // Already an array: [r, g, b] or [r, g, b, a]
  if (Array.isArray(raw)) {
    const nums = raw.map(Number).filter(n => Number.isFinite(n));
    if (nums.length >= 3) {
      return [nums[0], nums[1], nums[2], nums[3] ?? 120];
    }
    return DEFAULT_ZONE_COLOR;
  }

  if (typeof raw !== 'string' || raw.trim() === '') return DEFAULT_ZONE_COLOR;
  const s = raw.trim();

  // Hex: "#FF4500", "#ff4500", "FF4500", "#F40"
  const hexMatch = s.match(/^#?([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    // Short hex (#F40 -> FF4400)
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    if (hex.length === 4) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) : 120;
      return [r, g, b, a];
    }
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/i);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    const a = rgbMatch[4] !== undefined ? Math.round(Number(rgbMatch[4]) * (Number(rgbMatch[4]) <= 1 ? 255 : 1)) : 120;
    return [r, g, b, a];
  }

  return DEFAULT_ZONE_COLOR;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datasets = parseQueryArray(req.nextUrl.searchParams.get('datasets'));

  if (datasets.length > 0) {
    const invalid = datasets.filter(d => !VALID_FEATURE_TYPES.includes(d));
    if (invalid.length > 0) {
      return err('VALIDATION', `Invalid dataset value(s): ${invalid.join(', ')}. Valid values: ${VALID_FEATURE_TYPES.join(', ')}`, 400);
    }
  }

  const [features, actors] = await Promise.all([
    prisma.mapFeature.findMany({
      where: {
        conflictId: id,
        ...(datasets.length > 0 ? { featureType: { in: datasets as MapFeatureType[] } } : {}),
      },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        featureType: true,
        sourceEventId: true,
        actor: true,
        priority: true,
        category: true,
        type: true,
        status: true,
        timestamp: true,
        geometry: true,
        properties: true,
      },
    }),
    prisma.actor.findMany({
      where: { conflictId: id, mapKey: { not: null } },
      select: { mapKey: true, name: true, cssVar: true, colorRgb: true, affiliation: true, mapGroup: true },
    }),
  ]);

  if (features.length === 0 && !(await prisma.conflict.findUnique({ where: { id } }))) {
    return err('NOT_FOUND', `Conflict ${id} not found`, 404);
  }

  // Group by featureType and reconstruct typed arrays
  type Props = Record<string, unknown>;

  const KINETIC_DEFAULT = 'COMPLETE';
  const INSTALLATION_DEFAULT = 'ACTIVE';

  /** Normalize status: uppercase + default for null/unknown. */
  function normStatus(raw: string | null, featureType: string): string {
    if (!raw) return featureType === 'STRIKE_ARC' || featureType === 'MISSILE_TRACK' ? KINETIC_DEFAULT : INSTALLATION_DEFAULT;
    const upper = raw.toUpperCase();
    const valid = ['COMPLETE', 'INTERCEPTED', 'IMPACTED', 'ACTIVE', 'DEGRADED', 'STRUCK', 'DAMAGED', 'DESTROYED'];
    return valid.includes(upper) ? upper : (featureType === 'STRIKE_ARC' || featureType === 'MISSILE_TRACK' ? KINETIC_DEFAULT : INSTALLATION_DEFAULT);
  }

  const strikes = features
    .filter(f => f.featureType === 'STRIKE_ARC')
    .map(f => {
        const geo = normalizeKineticGeometry(f.geometry);
        if (!geo) return null;
        const props = f.properties as Props;
        return {
          id: f.id, sourceEventId: f.sourceEventId, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
          status: normStatus(f.status, f.featureType), timestamp: f.timestamp?.toISOString() ?? '',
          from: geo.from, to: geo.to, label: props.label, severity: props.severity,
        };
    })
    .filter(Boolean);

  const missiles = features
    .filter(f => f.featureType === 'MISSILE_TRACK')
    .map(f => {
        const geo = normalizeKineticGeometry(f.geometry);
        if (!geo) return null;
        const props = f.properties as Props;
        return {
          id: f.id, sourceEventId: f.sourceEventId, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
          status: normStatus(f.status, f.featureType), timestamp: f.timestamp?.toISOString() ?? '',
          from: geo.from, to: geo.to, label: props.label, severity: props.severity,
        };
    })
    .filter(Boolean);

  const targets = features
    .filter(f => f.featureType === 'TARGET')
    .map(f => {
        const geo = normalizePointGeometry(f.geometry);
        if (!geo) return null;
        const props = f.properties as Props;
        return {
          id: f.id, sourceEventId: f.sourceEventId, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
          status: normStatus(f.status, f.featureType), timestamp: f.timestamp?.toISOString() ?? '',
          position: geo.position, name: props.name, description: props.description,
        };
    })
    .filter(Boolean);

  const assets = features
    .filter(f => f.featureType === 'ASSET')
    .map(f => {
        const geo = normalizePointGeometry(f.geometry);
        if (!geo) return null;
        const props = f.properties as Props;
        return {
          id: f.id, sourceEventId: f.sourceEventId, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
          status: normStatus(f.status, f.featureType), timestamp: f.timestamp?.toISOString() ?? '',
          position: geo.position, name: props.name, description: props.description,
        };
    })
    .filter(Boolean);

  const threatZones = features
    .filter(f => f.featureType === 'THREAT_ZONE')
    .map(f => {
        const geo = normalizePolygonGeometry(f.geometry);
        if (!geo) return null;
        const props = f.properties as Props;
        return {
          id: f.id, sourceEventId: f.sourceEventId, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
          timestamp: f.timestamp?.toISOString() ?? '', coordinates: geo.coordinates, name: props.name, color: normalizeColor(props.color),
        };
    })
    .filter(Boolean);

  const heatPoints = features
    .filter(f => f.featureType === 'HEAT_POINT')
    .map(f => {
        const geo = normalizePointGeometry(f.geometry);
        if (!geo) return null;
        const props = f.properties as Props;
        return {
          id: f.id, sourceEventId: f.sourceEventId, actor: f.actor, priority: f.priority,
          position: geo.position, weight: props.weight,
        };
    })
    .filter(Boolean);

  // Build actorMeta keyed by mapKey
  const actorMeta: Record<string, {
    label: string; cssVar: string; rgb: number[]; affiliation: string; group: string;
  }> = {};
  for (const a of actors) {
    if (a.mapKey) {
      actorMeta[a.mapKey] = {
        label: a.name,
        cssVar: a.cssVar ?? 'var(--t3)',
        rgb: a.colorRgb,
        affiliation: a.affiliation ?? 'NEUTRAL',
        group: a.mapGroup ?? 'Unknown',
      };
    }
  }

  return ok(
    { strikes, missiles, targets, assets, threatZones, heatPoints, actorMeta },
    {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    },
  );
}
