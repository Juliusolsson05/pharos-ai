import { Router } from 'express';
import { createHash } from 'node:crypto';

import { config } from '../../config.js';
import { err, ok } from '../../lib/api-utils.js';
import { getTile } from '../../lib/storage.js';
import { getCompositeManifest, getCompositeTile, getLatestCompositeManifest } from '../../providers/nightlights/composite.js';
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

const MANIFEST_TTL = 5 * 60 * 1000;
const MANIFEST_CACHE_CONTROL_LATEST = 'public, max-age=60, stale-while-revalidate=300';
const MANIFEST_CACHE_CONTROL_DATED = 'public, max-age=3600, stale-while-revalidate=86400';

function etagFor(value: unknown) {
  return `W/"${createHash('sha1').update(JSON.stringify(value)).digest('hex')}"`;
}

function serveManifest(
  req: import('express').Request,
  res: import('express').Response,
  data: unknown,
  cacheControl: string,
) {
  const etag = etagFor(data);
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  ok(res, data);
}

function serveTile(res: import('express').Response, tile: Buffer | null, cacheSeconds: number) {
  res.setHeader('Content-Type', 'image/webp');
  if (!tile) {
    res.setHeader('Cache-Control', `public, max-age=${cacheSeconds}, immutable`);
    res.send(EMPTY_TILE);
    return;
  }
  res.setHeader('Cache-Control', `public, max-age=${cacheSeconds}, immutable`);
  res.send(tile);
}

// ─── Manifest cache (5 min TTL) ─────────────────────────────

let manifestCache: { data: unknown; cachedAt: number; key: string } | null = null;

async function buildManifest(requestedDate: string, dailyDate: string, snapshotDate: string | null) {
  const [dailyBounds, dailyCount, snapshotBounds, snapshotCount] = await Promise.all([
    getDailyBounds(dailyDate),
    getDailyCount(dailyDate),
    snapshotDate ? getSnapshotBounds(snapshotDate) : null,
    snapshotDate ? getSnapshotCount(snapshotDate) : 0,
  ]);

  return {
    composite: {
      date: dailyDate,
      tileUrl: `/api/nightlights/composite/${requestedDate}/{z}/{x}/{y}.webp`,
      bounds: snapshotBounds ?? dailyBounds,
      count: Math.max(dailyCount, snapshotCount),
    },
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
    serveManifest(_req, res, manifestCache.data, MANIFEST_CACHE_CONTROL_LATEST);
    return;
  }

  const dailyDate = await resolveLatestDailyDate();
  if (!dailyDate) {
    return err(res, 'NOT_FOUND', 'No daily nightlights available', 404);
  }

  const snapshotDate = await resolveLatestSnapshotDate();
  const data = await buildManifest(dailyDate, dailyDate, snapshotDate);

  manifestCache = { data, cachedAt: Date.now(), key: cacheKey };
  serveManifest(_req, res, data, MANIFEST_CACHE_CONTROL_LATEST);
});

router.get('/api/nightlights/:date/manifest', async (req, res) => {
  const requestedDate = parseDateParam(req.params);
  if (!requestedDate) {
    return err(res, 'INVALID_PARAMS', 'Invalid date', 400);
  }

  const cacheKey = requestedDate;
  if (manifestCache && manifestCache.key === cacheKey && Date.now() - manifestCache.cachedAt < MANIFEST_TTL) {
    serveManifest(req, res, manifestCache.data, MANIFEST_CACHE_CONTROL_DATED);
    return;
  }

  const dailyDate = await resolveDailyDateOnOrBefore(requestedDate);
  if (!dailyDate) {
    return err(res, 'NOT_FOUND', `No daily nightlights on or before ${requestedDate}`, 404);
  }

  const snapshotDate = await resolveSnapshotDateOnOrBefore(dailyDate)
    ?? await resolveLatestSnapshotDate();
  const data = await buildManifest(requestedDate, dailyDate, snapshotDate);

  manifestCache = { data, cachedAt: Date.now(), key: cacheKey };
  serveManifest(req, res, data, MANIFEST_CACHE_CONTROL_DATED);
});

router.get('/api/nightlights/composite/latest/manifest', async (req, res) => {
  try {
    const data = await getLatestCompositeManifest();
    serveManifest(req, res, data, MANIFEST_CACHE_CONTROL_LATEST);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build composite manifest';
    return err(res, 'COMPOSITE_MANIFEST_ERROR', message, 503);
  }
});

router.get('/api/nightlights/composite/:date/manifest', async (req, res) => {
  const requestedDate = parseDateParam(req.params);
  if (!requestedDate) {
    return err(res, 'INVALID_PARAMS', 'Invalid date', 400);
  }

  try {
    const data = await getCompositeManifest(requestedDate);
    serveManifest(req, res, data, MANIFEST_CACHE_CONTROL_DATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build composite manifest';
    return err(res, 'COMPOSITE_MANIFEST_ERROR', message, 503);
  }
});

// ─── Tile serving ────────────────────────────────────────────

router.get('/api/nightlights/composite/:date/:z/:x/:y.webp', async (req, res) => {
  const parsed = parseTileParams(req.params);
  if (!parsed) {
    return err(res, 'INVALID_PARAMS', 'Invalid tile coordinates or date', 400);
  }

  try {
    const result = await getCompositeTile(parsed.date, parsed);
    serveTile(res, result?.tile ?? null, 86400);
  } catch (error) {
    console.error('[nightlights] composite tile error:', error);
    serveTile(res, null, 60);
  }
});

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
