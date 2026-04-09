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

// Three workload classes to prevent heavy jobs from blocking time-sensitive ones
export const realtimeQueue = new Queue('osint-realtime', { connection });
export const standardQueue = new Queue('osint-standard', { connection });
export const heavyQueue = new Queue('osint-heavy', { connection });

// Keep the old name for backward compatibility with scheduler
export const ingestQueue = standardQueue;

export function createRealtimeWorker(processor: (job: Job) => Promise<unknown>) {
  return new Worker('osint-realtime', processor, { connection, concurrency: 2 });
}

export function createStandardWorker(processor: (job: Job) => Promise<unknown>) {
  return new Worker('osint-standard', processor, { connection, concurrency: 1 });
}

export function createHeavyWorker(processor: (job: Job) => Promise<unknown>) {
  return new Worker('osint-heavy', processor, { connection, concurrency: 1 });
}
