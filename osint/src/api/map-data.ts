import { Router } from 'express';

import { prisma } from '../db.js';
import { ok } from '../lib/api-utils.js';
import type { MapDataResponse, StrikeArc, Asset, ThreatZone, HeatPoint, ActorMeta } from '../types.js';

const router = Router();

router.get('/api/map-data', async (_req, res) => {
  const features = await prisma.mapFeature.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10000,
  });

  const strikes: StrikeArc[] = [];
  const assets: Asset[] = [];
  const threatZones: ThreatZone[] = [];
  const heatPoints: HeatPoint[] = [];
  const actorNames = new Set<string>();

  for (const f of features) {
    const geo = f.geometry as Record<string, unknown>;
    const props = f.properties as Record<string, unknown>;
    const actor = f.actor || 'Unknown';
    actorNames.add(actor);

    switch (f.featureType) {
      case 'STRIKE_ARC': {
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
        break;
      }

      case 'ASSET': {
        const position = geo.position as [number, number];
        assets.push({
          id: f.id,
          sourceEventId: f.sourceEventId,
          actor,
          priority: f.priority as Asset['priority'],
          category: 'INSTALLATION',
          type: f.type as Asset['type'],
          status: (f.status as Asset['status']) || 'ACTIVE',
          name: (props.name as string) || 'Unknown',
          position,
          description: (props.country as string) || undefined,
        });
        break;
      }

      case 'THREAT_ZONE': {
        const coordinates = geo.coordinates as [number, number][];
        if (!coordinates || coordinates.length === 0) break;
        threatZones.push({
          id: f.id,
          sourceEventId: f.sourceEventId,
          actor,
          priority: f.priority as ThreatZone['priority'],
          category: 'ZONE',
          type: (f.type as ThreatZone['type']) || 'CLOSURE',
          name: (props.name as string) || '',
          coordinates,
          color: [236, 154, 60, 80], // warning-dim
        });
        break;
      }

      case 'HEAT_POINT': {
        heatPoints.push({
          id: f.id,
          sourceEventId: f.sourceEventId,
          actor,
          priority: f.priority,
          position: geo.position as [number, number],
          weight: (props.weight as number) || 1,
        });
        break;
      }
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
    assets,
    threatZones,
    heatPoints,
    actorMeta,
  };

  ok(res, data);
});

export default router;
