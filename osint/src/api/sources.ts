import { Router } from 'express';

import { prisma } from '../db.js';
import { ok } from '../lib/api-utils.js';

const router = Router();

router.get('/api/sources', async (_req, res) => {
  const syncs = await prisma.sourceSync.findMany();
  const data: Record<string, unknown> = {};

  for (const s of syncs) {
    data[s.source] = {
      lastCursor: s.lastCursor,
      lastRunAt: s.lastRunAt,
      lastRunStatus: s.lastRunStatus,
      lastRunCount: s.lastRunCount,
      totalEvents: s.totalEvents,
      lastError: s.lastError,
    };
  }

  ok(res, data);
});

export default router;
