import { Router } from 'express';

import { err, ok } from '../../lib/api-utils.js';
import { PROVIDER_CONFIGS } from './configs.js';
import { getFeatureRows } from './provider-helpers.js';

const router = Router();

type BatchQuery = {
  provider: string;
  limit: number;
};

function parseBatchParams(query: Record<string, unknown>): BatchQuery[] {
  const raw = String(query.providers ?? '');
  if (!raw) return [];

  return raw.split(',').map((entry) => {
    const [provider, limitStr] = entry.split(':');
    const limit = limitStr ? Math.min(Math.max(parseInt(limitStr, 10) || 100, 1), 500) : 100;
    return { provider: provider.trim(), limit };
  });
}

router.get('/api/batch', async (req, res) => {
  const queries = parseBatchParams(req.query as Record<string, unknown>);
  if (queries.length === 0) {
    return err(res, 'MISSING_PARAMS', 'Provide ?providers=gdelt:200,firms:500,...', 400);
  }

  const results = await Promise.all(
    queries.map(async ({ provider, limit }) => {
      const config = PROVIDER_CONFIGS[provider];
      if (!config) {
        return { provider, items: [], total: 0, error: 'unknown_provider' };
      }

      const items = await getFeatureRows(config, limit, 0);
      return { provider, items: items ?? [], total: (items ?? []).length };
    }),
  );

  const data: Record<string, { items: unknown[]; total: number }> = {};
  for (const r of results) {
    data[r.provider] = { items: r.items, total: r.total };
  }

  return ok(res, data);
});

export default router;
