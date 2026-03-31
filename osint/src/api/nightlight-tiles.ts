import { Router } from 'express';

import { config } from '../config.js';
import { prisma } from '../db.js';
import { getTile } from '../lib/storage.js';
import { ok, err } from '../lib/api-utils.js';
import {
  dailyTileKey,
  getCompositeManifest,
  getCompositeTile,
  getLatestCompositeManifest,
  snapshotTileKey,
} from '../providers/nightlights/index.js';

const router = Router();

function parseTileParams(params: Record<string, string | undefined>) {
  const date = params.date || '';
  const z = parseInt(params.z || '', 10);
  const x = parseInt(params.x || '', 10);
  const y = parseInt((params['y.webp'] ?? params.y?.replace('.webp', '') ?? ''), 10);

  if (isNaN(z) || isNaN(x) || isNaN(y) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  return { date, z, x, y };
}

function parseDateParam(params: Record<string, string | undefined>) {
  const date = params.date || '';
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

router.get('/api/nightlights/latest/manifest', async (_req, res) => {
  try {
    const manifest = await getLatestCompositeManifest();
    return ok(res, manifest);
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
    const manifest = await getCompositeManifest(date);
    return ok(res, manifest);
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

// Serve a display tile by date and coordinates
router.get('/api/nightlights/:date/:z/:x/:y.webp', async (req, res) => {
  const parsed = parseTileParams(req.params);
  if (!parsed) {
    return err(res, 'INVALID_PARAMS', 'Invalid tile coordinates or date', 400);
  }

  const s3Key = dailyTileKey(parsed.date, parsed.z, parsed.x, parsed.y);
  const tile = await getTile(config.nightlights.tileBucket, s3Key);

  if (!tile) {
    res.status(404).send('');
    return;
  }

  res.setHeader('Content-Type', 'image/webp');
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  res.send(tile);
});

// Serve a full-land snapshot tile
router.get('/api/nightlights/snapshots/:date/:z/:x/:y.webp', async (req, res) => {
  const parsed = parseTileParams(req.params);
  if (!parsed) {
    return err(res, 'INVALID_PARAMS', 'Invalid tile coordinates or date', 400);
  }

  const s3Key = snapshotTileKey(parsed.date, parsed.z, parsed.x, parsed.y);
  const tile = await getTile(config.nightlights.tileBucket, s3Key);

  if (!tile) {
    res.status(404).send('');
    return;
  }

  res.setHeader('Content-Type', 'image/webp');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 7 days cache for snapshots
  res.send(tile);
});

// List available snapshot dates
router.get('/api/nightlights/snapshots/dates', async (_req, res) => {
  const rows = await prisma.nightlightSnapshot.findMany({
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'desc' },
  });
  ok(res, rows.map((r) => r.date));
});

// List available dates
router.get('/api/nightlights/dates', async (_req, res) => {
  const rows = await prisma.nightlightTile.findMany({
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'desc' },
  });
  ok(res, rows.map((r) => r.date));
});

// Radiance anomaly detection between two dates
router.get('/api/nightlights/anomalies', async (req, res) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const threshold = parseFloat((req.query.threshold as string) || '15');

  if (!from || !to) {
    return err(res, 'MISSING_PARAMS', 'Provide ?from=YYYY-MM-DD&to=YYYY-MM-DD', 400);
  }

  // Compare avgRadiance between two dates for all tiles
  const anomalies = await prisma.$queryRawUnsafe<
    { z: number; x: number; y: number; region: string; radiance_from: number; radiance_to: number; drop_pct: number }[]
  >(
    `SELECT
       a.z, a.x, a.y, a.region,
       a."avgRadiance" as radiance_from,
       b."avgRadiance" as radiance_to,
       ROUND(((a."avgRadiance" - b."avgRadiance") / NULLIF(a."avgRadiance", 0) * 100)::numeric, 1) as drop_pct
     FROM osint.nightlight_tiles a
     JOIN osint.nightlight_tiles b ON a.z = b.z AND a.x = b.x AND a.y = b.y
     WHERE a.date = $1 AND b.date = $2
       AND a."avgRadiance" > 0
       AND ((a."avgRadiance" - b."avgRadiance") / NULLIF(a."avgRadiance", 0) * 100) > $3
     ORDER BY drop_pct DESC
     LIMIT 500`,
    from,
    to,
    threshold,
  );

  ok(res, anomalies);
});

export default router;
