import { Router } from 'express';

import { prisma } from '../db.js';
import { ok } from '../lib/api-utils.js';
import type { MapDataResponse, StrikeArc, HeatPoint, ActorMeta } from '../types.js';

const router = Router();

router.get('/api/map-data', async (_req, res) => {
  const features = await prisma.mapFeature.findMany({
    orderBy: { timestamp: 'desc' },
    take: 5000,
  });

  const strikes: StrikeArc[] = [];
  const heatPoints: HeatPoint[] = [];
  const actorNames = new Set<string>();

  for (const f of features) {
    const geo = f.geometry as Record<string, unknown>;
    const props = f.properties as Record<string, unknown>;

    if (f.featureType === 'STRIKE_ARC') {
      const actor = f.actor || 'Unknown';
      actorNames.add(actor);

      // GDELT provides impact point only — from and to are identical.
      // The frontend renders these as point markers, not arcs.
      const position = geo.position as [number, number];
      strikes.push({
        id: f.id,
        sourceEventId: f.sourceEventId,
        actor,
        priority: f.priority as StrikeArc['priority'],
        category: 'KINETIC',
        type: f.type as StrikeArc['type'],
        status: 'COMPLETE',
        timestamp: f.timestamp?.toISOString() ?? '',
        from: position,
        to: position,
        label: (props.label as string) || '',
        severity: (props.severity as StrikeArc['severity']) || 'HIGH',
      });
    }

    if (f.featureType === 'HEAT_POINT') {
      const actor = f.actor || 'Unknown';
      actorNames.add(actor);
      heatPoints.push({
        id: f.id,
        sourceEventId: f.sourceEventId,
        actor,
        priority: f.priority,
        position: geo.position as [number, number],
        weight: (props.weight as number) || 1,
      });
    }
  }

  const actorMeta: Record<string, ActorMeta> = {};
  for (const name of actorNames) {
    actorMeta[name] = {
      label: name,
      cssVar: 'var(--t3)',
      rgb: [143, 153, 168],
      affiliation: 'NEUTRAL',
      group: 'OSINT',
    };
  }

  const data: MapDataResponse = {
    strikes,
    missiles: [],
    targets: [],
    assets: [],
    threatZones: [],
    heatPoints,
    actorMeta,
  };

  ok(res, data);
});

export default router;
