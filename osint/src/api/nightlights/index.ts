import { Router } from 'express';

import { config } from '../../config.js';
import { err, ok } from '../../lib/api-utils.js';
import { getTile } from '../../lib/storage.js';
import {
  dailyTileKey,
  getCompositeManifest,
  getCompositeTile,
  getLatestCompositeManifest,
  snapshotTileKey,
} from '../../providers/nightlights/index.js';
import { getAnomalies, getDailyDates, getSnapshotDates } from './data.js';
import { parseDateParam, parseTileParams } from './params.js';

const router = Router();

router.get('/api/nightlights/latest/manifest', async (_req, res) => {
  try {
    return ok(res, await getLatestCompositeManifest());
  } catch (error) {
    return err(res, 'NOT_FOUND', error instanceof Error ? error.message : 'No composite nightlights available', 404);
  }
});

router.get('/api/nightlights/composite/:date/manifest', async (req, res) => {
  const date = parseDateParam(req.params);
  if (!date) {
    return err(res, 'INVALID_PARAMS', 'Invalid date', 400);
  }

  try {
    return ok(res, await getCompositeManifest(date));
  } catch (error) {
    return err(res, 'NOT_FOUND', error instanceof Error ? error.message : 'No composite nightlights available', 404);
  }
});

router.get('/api/nightlights/composite/:date/:z/:x/:y.webp', async (req, res) => {
  const parsed = parseTileParams(req.params);
  if (!parsed) {
    return err(res, 'INVALID_PARAMS', 'Invalid tile coordinates or date', 400);
  }

  try {
    const result = await getCompositeTile(parsed.date, parsed);
    if (!result) {
      res.status(404).send('');
      return;
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', result.source === 'daily' ? 'public, max-age=86400, immutable' : 'public, max-age=604800, immutable');
    res.setHeader('X-Nightlights-Source', result.source);
    res.setHeader('X-Nightlights-Daily-Date', result.resolvedDailyDate);
    if (result.resolvedSnapshotDate) {
      res.setHeader('X-Nightlights-Snapshot-Date', result.resolvedSnapshotDate);
    }
    res.send(result.tile);
  } catch (error) {
    return err(res, 'NOT_FOUND', error instanceof Error ? error.message : 'No composite nightlights available', 404);
  }
});

router.get('/api/nightlights/:date/:z/:x/:y.webp', async (req, res) => {
  const parsed = parseTileParams(req.params);
  if (!parsed) {
    return err(res, 'INVALID_PARAMS', 'Invalid tile coordinates or date', 400);
  }

  const tile = await getTile(config.nightlights.tileBucket, dailyTileKey(parsed.date, parsed.z, parsed.x, parsed.y));
  if (!tile) {
    res.status(404).send('');
    return;
  }

  res.setHeader('Content-Type', 'image/webp');
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  res.send(tile);
});

router.get('/api/nightlights/snapshots/:date/:z/:x/:y.webp', async (req, res) => {
  const parsed = parseTileParams(req.params);
  if (!parsed) {
    return err(res, 'INVALID_PARAMS', 'Invalid tile coordinates or date', 400);
  }

  const tile = await getTile(config.nightlights.tileBucket, snapshotTileKey(parsed.date, parsed.z, parsed.x, parsed.y));
  if (!tile) {
    res.status(404).send('');
    return;
  }

  res.setHeader('Content-Type', 'image/webp');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.send(tile);
});

router.get('/api/nightlights/snapshots/dates', async (_req, res) => {
  ok(res, await getSnapshotDates());
});

router.get('/api/nightlights/dates', async (_req, res) => {
  ok(res, await getDailyDates());
});

router.get('/api/nightlights/anomalies', async (req, res) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const threshold = parseFloat((req.query.threshold as string) || '15');

  if (!from || !to) {
    return err(res, 'MISSING_PARAMS', 'Provide ?from=YYYY-MM-DD&to=YYYY-MM-DD', 400);
  }

  ok(res, await getAnomalies(from, to, threshold));
});

export default router;
