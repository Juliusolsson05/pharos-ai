import { NextRequest } from 'next/server';

import { err, ok, parseQueryArray } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datasets = parseQueryArray(req.nextUrl.searchParams.get('datasets'));

  const [features, actors] = await Promise.all([
    prisma.mapFeature.findMany({
      where: {
        conflictId: id,
        ...(datasets.length > 0 ? { featureType: { in: datasets as never[] } } : {}),
      },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        featureType: true,
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
  type Geo = Record<string, unknown>;
  type Props = Record<string, unknown>;

  const strikes = features
    .filter(f => f.featureType === 'STRIKE_ARC')
    .map(f => {
      const geo = f.geometry as Geo;
      const props = f.properties as Props;
      return {
        id: f.id, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
        status: f.status, timestamp: f.timestamp?.toISOString() ?? '',
        from: geo.from, to: geo.to, label: props.label, severity: props.severity,
      };
    });

  const missiles = features
    .filter(f => f.featureType === 'MISSILE_TRACK')
    .map(f => {
      const geo = f.geometry as Geo;
      const props = f.properties as Props;
      return {
        id: f.id, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
        status: f.status, timestamp: f.timestamp?.toISOString() ?? '',
        from: geo.from, to: geo.to, label: props.label, severity: props.severity,
      };
    });

  const targets = features
    .filter(f => f.featureType === 'TARGET')
    .map(f => {
      const geo = f.geometry as Geo;
      const props = f.properties as Props;
      return {
        id: f.id, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
        status: f.status, timestamp: f.timestamp?.toISOString() ?? '',
        position: geo.position, name: props.name, description: props.description,
      };
    });

  const assets = features
    .filter(f => f.featureType === 'ASSET')
    .map(f => {
      const geo = f.geometry as Geo;
      const props = f.properties as Props;
      return {
        id: f.id, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
        status: f.status, timestamp: f.timestamp?.toISOString() ?? '',
        position: geo.position, name: props.name, description: props.description,
      };
    });

  const threatZones = features
    .filter(f => f.featureType === 'THREAT_ZONE')
    .map(f => {
      const geo = f.geometry as Geo;
      const props = f.properties as Props;
      return {
        id: f.id, actor: f.actor, priority: f.priority, category: f.category, type: f.type,
        timestamp: f.timestamp?.toISOString() ?? '', coordinates: geo.coordinates, name: props.name, color: props.color,
      };
    });

  const heatPoints = features
    .filter(f => f.featureType === 'HEAT_POINT')
    .map(f => {
      const geo = f.geometry as Geo;
      const props = f.properties as Props;
      return { position: geo.position, weight: props.weight };
    });

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
