import { Router } from 'express';

import { prisma } from '../../../db.js';
import { err, ok } from '../../../lib/api-utils.js';
import { parsePageParams } from '../provider-helpers.js';

const SOURCE = 'reference';
const router = Router();

router.get('/features', async (req, res) => {
  const { limit, offset } = parsePageParams(req.query as Record<string, unknown>);
  const kind = typeof req.query.kind === 'string' ? req.query.kind : 'all';

  if (!['all', 'installations', 'vessels'].includes(kind)) {
    return err(res, 'INVALID_KIND', 'Use ?kind=all, ?kind=installations, or ?kind=vessels', 400);
  }

  const [installations, vessels] = await Promise.all([
    kind === 'vessels'
      ? Promise.resolve([])
      : prisma.referenceInstallation.findMany({ orderBy: { seededAt: 'desc' }, take: kind === 'all' ? limit : limit, skip: offset }),
    kind === 'installations'
      ? Promise.resolve([])
      : prisma.referenceVessel.findMany({ orderBy: { seededAt: 'desc' }, take: kind === 'all' ? limit : limit, skip: offset }),
  ]);

  const items = [
    ...installations.map((item) => ({ featureKind: 'installation', ...item })),
    ...vessels.map((item) => ({ featureKind: 'vessel', ...item })),
  ].slice(0, limit);

  const total = (kind === 'vessels' ? 0 : await prisma.referenceInstallation.count())
    + (kind === 'installations' ? 0 : await prisma.referenceVessel.count());

  return ok(res, {
    source: SOURCE,
    kind,
    total,
    limit,
    offset,
    items,
  });
});

router.get('/raw', async (req, res) => {
  const { limit, offset } = parsePageParams(req.query as Record<string, unknown>);
  const kind = typeof req.query.kind === 'string' ? req.query.kind : 'installations';

  if (kind !== 'installations' && kind !== 'vessels') {
    return err(res, 'INVALID_KIND', 'Use ?kind=installations or ?kind=vessels', 400);
  }

  const total = kind === 'vessels'
    ? await prisma.referenceVessel.count()
    : await prisma.referenceInstallation.count();

  const items = kind === 'vessels'
    ? await prisma.referenceVessel.findMany({ orderBy: { seededAt: 'desc' }, take: limit, skip: offset })
    : await prisma.referenceInstallation.findMany({ orderBy: { seededAt: 'desc' }, take: limit, skip: offset });

  return ok(res, { source: SOURCE, kind, total, limit, offset, items });
});

router.get('/meta', async (_req, res) => {
  const [sync, installationCount, vesselCount] = await Promise.all([
    prisma.sourceSync.findUnique({ where: { source: SOURCE } }),
    prisma.referenceInstallation.count(),
    prisma.referenceVessel.count(),
  ]);

  return ok(res, {
    source: SOURCE,
    counts: {
      features: installationCount + vesselCount,
      installations: installationCount,
      vessels: vesselCount,
      raw: installationCount + vesselCount,
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
