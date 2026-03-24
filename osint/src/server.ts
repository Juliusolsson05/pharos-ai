import 'dotenv/config';
import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { config } from './config.js';
import { prisma } from './db.js';
import { ingestQueue, createWorker } from './queue.js';
import { registerJobs } from './jobs/scheduler.js';
import { processGdeltIngest } from './jobs/ingest-gdelt.js';

import healthRouter from './api/health.js';
import mapDataRouter from './api/map-data.js';
import sourcesRouter from './api/sources.js';

const app = express();
app.use(express.json());

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
app.use(mapDataRouter);
app.use(sourcesRouter);

// BullMQ worker
const worker = createWorker(async (job) => {
  if (job.name === 'gdelt') {
    return processGdeltIngest(job);
  }
  throw new Error(`Unknown job name: ${job.name}`);
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
  await registerJobs();

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
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
