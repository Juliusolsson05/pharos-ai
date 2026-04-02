import { Router } from 'express';

import { prisma } from '../../db.js';
import { err, ok } from '../../lib/api-utils.js';
import { getFeatureCount, getFeatureRows, getRawCount, getRawRows, parsePageParams, type ProviderApiConfig } from './provider-helpers.js';

export function createProviderRouter(config: ProviderApiConfig) {
  const router = Router();

  router.get('/features', async (req, res) => {
    const { limit, offset, includeRaw } = parsePageParams(req.query as Record<string, unknown>);
    const features = await getFeatureRows(config, limit, offset, includeRaw);
    if (features === null) {
      return err(res, 'FEATURES_NOT_AVAILABLE', `Features endpoint is not available for ${config.source}`, 404);
    }

    return ok(res, {
      source: config.source,
      total: await getFeatureCount(config),
      limit,
      offset,
      items: features,
    });
  });

  router.get('/raw', async (req, res) => {
    const { limit, offset } = parsePageParams(req.query as Record<string, unknown>);
    const rows = await getRawRows(config, limit, offset);
    if (rows === null) {
      return err(res, 'RAW_NOT_AVAILABLE', `Raw endpoint is not available for ${config.source}`, 404);
    }

    return ok(res, {
      source: config.source,
      total: await getRawCount(config),
      limit,
      offset,
      items: rows,
    });
  });

  router.get('/meta', async (_req, res) => {
    const [sync, featureCount, rawCount] = await Promise.all([
      prisma.sourceSync.findUnique({ where: { source: config.source } }),
      getFeatureCount(config),
      getRawCount(config),
    ]);

    return ok(res, {
      source: config.source,
      counts: {
        features: featureCount,
        raw: rawCount,
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

  return router;
}
