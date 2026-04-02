import { Router } from 'express';

import { config } from '../../config.js';
import { err, ok } from '../../lib/api-utils.js';
import { getTile } from '../../lib/storage.js';
import { dailyTileKey, snapshotTileKey } from '../../providers/nightlights/keys.js';
import {
  getAnomalies,
  getDailyBounds,
  getDailyCount,
  getDailyDates,
  getSnapshotBounds,
  getSnapshotCount,
  getSnapshotDates,
  resolveDailyDateOnOrBefore,
  resolveLatestDailyDate,
  resolveLatestSnapshotDate,
  resolveSnapshotDateOnOrBefore,
} from './data.js';
import { parseDateParam, parseTileParams } from './params.js';

const router = Router();

// 1x1 transparent WebP — returned for missing tiles so browsers don't log 404 errors
const EMPTY_TILE = Buffer.from(
  'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
  'base64',
);

function serveTile(res: import('express').Response, tile: Buffer | null, cacheSeconds: number) {
  res.setHeader('Content-Type', 'image/webp');
  if (!tile) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.send(EMPTY_TILE);
    return;
  }
  res.setHeader('Cache-Control', `public, max-age=${cacheSeconds}, immutable`);
  res.send(tile);
}

// ─── Manifest cache (5 min TTL) ─────────────────────────────

const MANIFEST_TTL = 5 * 60 * 1000;
let manifestCache: { data: unknown; cachedAt: number; key: string } | null = null;

async function buildManifest(dailyDate: string, snapshotDate: string | null) {
  const [dailyBounds, dailyCount, snapshotBounds, snapshotCount] = await Promise.all([
    getDailyBounds(dailyDate),
    getDailyCount(dailyDate),
    snapshotDate ? getSnapshotBounds(snapshotDate) : null,
    snapshotDate ? getSnapshotCount(snapshotDate) : 0,
  ]);

  return {
    daily: {
      date: dailyDate,
      tileUrl: `/api/nightlights/${dailyDate}/{z}/{x}/{y}.webp`,
      bounds: dailyBounds,
      count: dailyCount,
    },
    snapshot: snapshotDate ? {
      date: snapshotDate,
      tileUrl: `/api/nightlights/snapshots/${snapshotDate}/{z}/{x}/{y}.webp`,
      bounds: snapshotBounds,
      count: snapshotCount,
    } : null,
    minzoom: 1,
    maxzoom: config.nightlights.zoomLevel,
    tileSize: 256,
  };
}

// ─── Manifest ────────────────────────────────────────────────

router.get('/api/nightlights/latest/manifest', async (_req, res) => {
  const cacheKey = 'latest';
  if (manifestCache && manifestCache.key === cacheKey && Date.now() - manifestCache.cachedAt < MANIFEST_TTL) {
    return ok(res, manifestCache.data);
  }

  const dailyDate = await resolveLatestDailyDate();
  if (!dailyDate) {
    return err(res, 'NOT_FOUND', 'No daily nightlights available', 404);
  }

  const snapshotDate = await resolveLatestSnapshotDate();
  const data = await buildManifest(dailyDate, snapshotDate);

  manifestCache = { data, cachedAt: Date.now(), key: cacheKey };
  return ok(res, data);
});

router.get('/api/nightlights/:date/manifest', async (req, res) => {
  const requestedDate = parseDateParam(req.params);
  if (!requestedDate) {
    return err(res, 'INVALID_PARAMS', 'Invalid date', 400);
  }

  const cacheKey = requestedDate;
  if (manifestCache && manifestCache.key === cacheKey && Date.now() - manifestCache.cachedAt < MANIFEST_TTL) {
    return ok(res, manifestCache.data);
  }

  const dailyDate = await resolveDailyDateOnOrBefore(requestedDate);
  if (!dailyDate) {
    return err(res, 'NOT_FOUND', `No daily nightlights on or before ${requestedDate}`, 404);
  }

  const snapshotDate = await resolveSnapshotDateOnOrBefore(dailyDate)
    ?? await resolveLatestSnapshotDate();
  const data = await buildManifest(dailyDate, snapshotDate);

  manifestCache = { data, cachedAt: Date.now(), key: cacheKey };
  return ok(res, data);
});

// ─── Tile serving ────────────────────────────────────────────

router.get('/api/nightlights/:date/:z/:x/:y.webp', async (req, res) => {
  const parsed = parseTileParams(req.params);
  if (!parsed) {
    return err(res, 'INVALID_PARAMS', 'Invalid tile coordinates or date', 400);
  }

  const tile = await getTile(config.nightlights.tileBucket, dailyTileKey(parsed.date, parsed.z, parsed.x, parsed.y));
  serveTile(res, tile, 86400);
});

router.get('/api/nightlights/snapshots/:date/:z/:x/:y.webp', async (req, res) => {
  const parsed = parseTileParams(req.params);
  if (!parsed) {
    return err(res, 'INVALID_PARAMS', 'Invalid tile coordinates or date', 400);
  }

  const tile = await getTile(config.nightlights.tileBucket, snapshotTileKey(parsed.date, parsed.z, parsed.x, parsed.y));
  serveTile(res, tile, 604800);
});

// ─── Metadata ────────────────────────────────────────────────

router.get('/api/nightlights/dates', async (_req, res) => {
  ok(res, await getDailyDates());
});

router.get('/api/nightlights/snapshots/dates', async (_req, res) => {
  ok(res, await getSnapshotDates());
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
