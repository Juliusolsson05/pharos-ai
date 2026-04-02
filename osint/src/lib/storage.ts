import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';

import { config } from '../config.js';

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
): Promise<string> {
  const start = performance.now();
  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
  logS3('put', key, start);
  return key;
}

export async function getTile(bucket: string, key: string): Promise<Buffer | null> {
  const start = performance.now();
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    logS3('get', key, start);
    return Buffer.concat(chunks);
  } catch (e: unknown) {
    if ((e as { name?: string }).name === 'NoSuchKey') return null;
    throw e;
  }
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
