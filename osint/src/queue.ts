import { Queue, Worker } from 'bullmq';
import type { ConnectionOptions, Job } from 'bullmq';
import { Redis } from 'ioredis';

import { config } from './config.js';

const redisUrl = new URL(config.redis.url);

const connection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: redisUrl.port ? Number.parseInt(redisUrl.port, 10) : 6379,
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  db: redisUrl.pathname && redisUrl.pathname !== '/'
    ? Number.parseInt(redisUrl.pathname.slice(1), 10)
    : undefined,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(config.redis.url, { maxRetriesPerRequest: null });

export const ingestQueue = new Queue('osint-ingest', { connection });

export function createWorker(
  processor: (job: Job) => Promise<unknown>,
) {
  return new Worker('osint-ingest', processor, {
    connection,
    concurrency: 1,
  });
}
