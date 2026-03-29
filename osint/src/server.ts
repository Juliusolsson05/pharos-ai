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
import { processGkgIngest } from './jobs/ingest-gdelt-gkg.js';
import { processMentionsIngest } from './jobs/ingest-gdelt-mentions.js';
import { processGqgIngest } from './jobs/ingest-gdelt-gqg.js';
import { processGfgIngest } from './jobs/ingest-gdelt-gfg.js';
import { processFirmsIngest } from './jobs/ingest-firms.js';
import { processOverpassIngest } from './jobs/ingest-overpass.js';
import { processNgaIngest } from './jobs/ingest-nga.js';
import { processUsgsIngest } from './jobs/ingest-usgs.js';
import { processUcdpIngest } from './jobs/ingest-ucdp.js';
import { processOpenskyIngest } from './jobs/ingest-opensky.js';
import { processGpsjamIngest } from './jobs/ingest-gpsjam.js';
import { processOrefIngest } from './jobs/ingest-oref.js';
import { processMirtaIngest } from './jobs/ingest-mirta.js';
import { processEonetIngest } from './jobs/ingest-eonet.js';
import { processSafecastIngest } from './jobs/ingest-safecast.js';
import { processSubmarineCablesIngest } from './jobs/ingest-submarine-cables.js';
import { processCloudflareRadarIngest } from './jobs/ingest-cloudflare-radar.js';
import { processReferenceIngest } from './jobs/ingest-reference.js';
import { startStreams, stopStreams } from './streams/index.js';

import healthRouter from './api/health.js';
import mapDataRouter from './api/map-data.js';
import sourcesRouter from './api/sources.js';

const app = express();
app.use(express.json());

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
app.use(mapDataRouter);
app.use(sourcesRouter);

// BullMQ worker
const processors: Record<string, (job: import('bullmq').Job) => Promise<unknown>> = {
  gdelt: processGdeltIngest,
  'gdelt-gkg': processGkgIngest,
  'gdelt-mentions': processMentionsIngest,
  'gdelt-gqg': processGqgIngest,
  'gdelt-gfg': processGfgIngest,
  firms: processFirmsIngest,
  overpass: processOverpassIngest,
  nga: processNgaIngest,
  usgs: processUsgsIngest,
  ucdp: processUcdpIngest,
  opensky: processOpenskyIngest,
  gpsjam: processGpsjamIngest,
  oref: processOrefIngest,
  mirta: processMirtaIngest,
  eonet: processEonetIngest,
  safecast: processSafecastIngest,
  'submarine-cables': processSubmarineCablesIngest,
  'cloudflare-radar': processCloudflareRadarIngest,
  reference: processReferenceIngest,
};

const worker = createWorker(async (job) => {
  const fn = processors[job.name];
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
