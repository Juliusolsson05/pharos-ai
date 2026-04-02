import 'dotenv/config';
import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { Job } from 'bullmq';

import { config } from './config.js';
import { prisma } from './db.js';
import { ingestQueue, createWorker } from './queue.js';
import { PROCESSORS } from './jobs/index.js';
import { registerJobs } from './jobs/scheduler.js';
import { startStreams, stopStreams } from './streams/index.js';
import { ensureBucket } from './lib/storage.js';
import { registerProviderRoutes } from './api/providers/index.js';

import batchRouter from './api/providers/batch.js';
import healthRouter from './api/health.js';
import nightlightsRouter from './api/nightlights/index.js';
import sourcesRouter from './api/sources.js';

const app = express();
app.use(express.json());

// Request timing
app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const ms = (performance.now() - start).toFixed(1);
    // Skip noisy tile requests and Bull Board polling
    if (!req.originalUrl.includes('/admin/') && !req.originalUrl.endsWith('.webp')) {
      console.log(`[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

// CORS for local playground dev
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Bull Board — job dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullMQAdapter(ingestQueue)],
  serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());

// Routes
app.use(healthRouter);
app.use(sourcesRouter);
app.use(nightlightsRouter);
app.use(batchRouter);
registerProviderRoutes(app);

// BullMQ worker
const worker = createWorker(async (job) => {
  const fn = PROCESSORS[job.name] as ((job: Job) => Promise<unknown>) | undefined;
  if (!fn) throw new Error(`Unknown job name: ${job.name}`);
  return fn(job);
});

worker.on('completed', (job, result) => {
  console.log(`[worker] ${job.name} completed:`, JSON.stringify(result));
});

worker.on('failed', (job, err) => {
  console.error(`[worker] ${job?.name} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts ?? 1}):`, err.message);
});

worker.on('error', (err) => {
  console.error('[worker] Error:', err);
});

// Startup
async function start() {
  await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS osint');
  await ensureBucket(config.nightlights.tileBucket);
  await registerJobs();

  // Start persistent streams (WebSocket connections, etc.)
  startStreams();

  app.listen(config.port, () => {
    console.log(`OSINT service listening on :${config.port}`);
    console.log(`Job dashboard: http://localhost:${config.port}/admin/queues`);
  });
}

start().catch((e) => {
  console.error('Failed to start:', e);
  process.exit(1);
});

// Graceful shutdown
for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sig, async () => {
    console.log(`${sig} received, shutting down...`);
    stopStreams();
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
