import { Router } from 'express';

import { prisma } from '../db.js';
import { redis } from '../queue.js';
import { ok } from '../lib/api-utils.js';
import { getStreamStatuses } from '../streams/index.js';

const router = Router();

router.get('/api/health', async (_req, res) => {
  let dbOk = false;
  let redisOk = false;

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    dbOk = true;
  } catch { /* probe only */ }

  try {
    redisOk = redis.status === 'ready';
  } catch { /* probe only */ }

  const syncs = await prisma.sourceSync.findMany().catch(() => []);

  ok(res, {
    uptime: process.uptime(),
    db: dbOk,
    redis: redisOk,
    streams: getStreamStatuses(),
    sources: syncs.map((s) => ({
      source: s.source,
      lastRunAt: s.lastRunAt,
      lastRunStatus: s.lastRunStatus,
      lastRunCount: s.lastRunCount,
      totalEvents: s.totalEvents,
      lastError: s.lastError,
    })),
  });
});

export default router;
