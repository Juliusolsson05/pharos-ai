import { Router } from 'express';

import { prisma } from '../../../db.js';
import { ok } from '../../../lib/api-utils.js';
import { parsePageParams } from '../provider-helpers.js';

const SOURCE = 'submarine-cables';
const router = Router();

router.get('/features', async (req, res) => {
  const { limit, offset } = parsePageParams(req.query as Record<string, unknown>);
  const kind = typeof req.query.kind === 'string' ? req.query.kind : 'all';

  if (kind === 'cables') {
    const total = await prisma.submarineCable.count();
    const items = await prisma.submarineCable.findMany({ orderBy: { ingestedAt: 'desc' }, take: limit, skip: offset });
    return ok(res, { source: SOURCE, kind, total, limit, offset, items });
  }

  if (kind === 'landing-points') {
    const total = await prisma.submarineLandingPoint.count();
    const items = await prisma.submarineLandingPoint.findMany({ orderBy: { ingestedAt: 'desc' }, take: limit, skip: offset });
    return ok(res, { source: SOURCE, kind, total, limit, offset, items });
  }

  // kind=all
  const [cables, landingPoints] = await Promise.all([
    prisma.submarineCable.findMany({ orderBy: { ingestedAt: 'desc' } }),
    prisma.submarineLandingPoint.findMany({ orderBy: { ingestedAt: 'desc' } }),
  ]);

  return ok(res, {
    source: SOURCE,
    kind: 'all',
    cables: { total: cables.length, items: cables.slice(offset, offset + limit) },
    landingPoints: { total: landingPoints.length, items: landingPoints },
  });
});

router.get('/raw', async (req, res) => {
  const { limit, offset } = parsePageParams(req.query as Record<string, unknown>);
  const cables = await prisma.submarineCable.findMany({ orderBy: { ingestedAt: 'desc' }, take: limit, skip: offset });
  const total = await prisma.submarineCable.count();
  return ok(res, { source: SOURCE, total, limit, offset, items: cables });
});

router.get('/meta', async (_req, res) => {
  const [sync, cableCount, landingCount] = await Promise.all([
    prisma.sourceSync.findUnique({ where: { source: SOURCE } }),
    prisma.submarineCable.count(),
    prisma.submarineLandingPoint.count(),
  ]);

  return ok(res, {
    source: SOURCE,
    counts: {
      cables: cableCount,
      landingPoints: landingCount,
      total: cableCount + landingCount,
    },
    sync: sync ? {
      lastCursor: sync.lastCursor,
      lastRunAt: sync.lastRunAt,
      lastRunStatus: sync.lastRunStatus,
      lastRunCount: sync.lastRunCount,
      totalEvents: sync.totalEvents,
      lastError: sync.lastError,
    } : null,
  });
});

export default router;
