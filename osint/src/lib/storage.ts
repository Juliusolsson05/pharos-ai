import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';

import { config } from '../config.js';

type TileCacheEntry = {
  body: Buffer | null;
  expiresAt: number;
};

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: true, // required for MinIO
});

const S3_SLOW_MS = 200;
const TILE_CACHE_TTL_MS = 60_000;
const TILE_CACHE_MAX_ENTRIES = 512;
const tileCache = new Map<string, TileCacheEntry>();
const inflightTileReads = new Map<string, Promise<Buffer | null>>();

function tileCacheKey(bucket: string, key: string) {
  return `${bucket}:${key}`;
}

function touchTileCache(key: string, entry: TileCacheEntry) {
  tileCache.delete(key);
  tileCache.set(key, entry);

  if (tileCache.size > TILE_CACHE_MAX_ENTRIES) {
    const oldest = tileCache.keys().next().value;
    if (oldest) {
      tileCache.delete(oldest);
    }
  }
}

function readCachedTile(key: string): Buffer | null | undefined {
  const entry = tileCache.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt <= Date.now()) {
    tileCache.delete(key);
    return undefined;
  }

  touchTileCache(key, entry);
  return entry.body;
}

function writeCachedTile(key: string, body: Buffer | null) {
  touchTileCache(key, {
    body,
    expiresAt: Date.now() + TILE_CACHE_TTL_MS,
  });
}

function logS3(op: string, key: string, start: number) {
  const ms = performance.now() - start;
  if (ms >= S3_SLOW_MS) {
    console.log(`[s3] ${op} ${key} ${ms.toFixed(1)}ms`);
  }
}

export async function uploadRaw(key: string, body: Buffer): Promise<string> {
  const start = performance.now();
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: body,
    }),
  );
  logS3('put', key, start);
  return key;
}

export async function uploadTile(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
  cacheControl?: string,
): Promise<string> {
  const start = performance.now();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );
  writeCachedTile(tileCacheKey(bucket, key), body);
  logS3('put', key, start);
  return key;
}

export async function getTile(bucket: string, key: string): Promise<Buffer | null> {
  const cacheKey = tileCacheKey(bucket, key);
  const cached = readCachedTile(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const inflight = inflightTileReads.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const start = performance.now();
  const pending = (async () => {
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const chunks: Uint8Array[] = [];
      for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }

      const body = Buffer.concat(chunks);
      writeCachedTile(cacheKey, body);
      logS3('get', key, start);
      return body;
    } catch (e: unknown) {
      if ((e as { name?: string }).name === 'NoSuchKey') {
        writeCachedTile(cacheKey, null);
        return null;
      }
      throw e;
    } finally {
      inflightTileReads.delete(cacheKey);
    }
  })();

  inflightTileReads.set(cacheKey, pending);
  return pending;
}

export async function ensureBucket(bucket: string): Promise<void> {
  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  } catch (e: unknown) {
    const name = (e as { name?: string }).name;
    if (name === 'BucketAlreadyOwnedByYou' || name === 'BucketAlreadyExists') return;
    throw e;
  }
}
