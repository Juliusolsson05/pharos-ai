import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { uploadRaw } from '../lib/storage.js';
import {
  fetchLatestExportUrl,
  downloadAndParse,
  buildStrikes,
  buildHeatPoints,
} from '../providers/gdelt/index.js';

const SOURCE = 'gdelt';

type IngestResult = {
  status: 'ok' | 'skipped';
  exportUrl: string;
  rowsParsed: number;
  eventsUpserted: number;
  featuresCreated: number;
  archivedFileKey: string | null;
  durationMs: number;
};

export async function processGdeltIngest(job: Job): Promise<IngestResult> {
  const start = Date.now();

  await job.log('Resolving latest GDELT export URL');
  const exportUrl = await fetchLatestExportUrl();
  await job.log(`Export URL: ${exportUrl}`);
  await job.updateProgress(10);

  // Dedupe — skip if we already ingested this exact file
  const sync = await prisma.sourceSync.findUnique({ where: { source: SOURCE } });
  if (sync?.lastCursor === exportUrl) {
    await job.log('Already ingested this export, skipping');
    return {
      status: 'skipped',
      exportUrl,
      rowsParsed: 0,
      eventsUpserted: 0,
      featuresCreated: 0,
      archivedFileKey: null,
      durationMs: Date.now() - start,
    };
  }

  await job.log('Downloading and parsing CSV');
  const { rows, rawZip } = await downloadAndParse(exportUrl);
  await job.log(`Parsed ${rows.length} conflict events from CSV`);
  await job.updateProgress(30);

  if (rows.length === 0) {
    await upsertSync(exportUrl, 'ok', null, 0, 0);
    return {
      status: 'ok',
      exportUrl,
      rowsParsed: 0,
      eventsUpserted: 0,
      featuresCreated: 0,
      archivedFileKey: null,
      durationMs: Date.now() - start,
    };
  }

  // Archive raw ZIP to object storage
  const ts = exportUrl.match(/(\d{14})/)?.[1] || Date.now().toString();
  const fileKey = `gdelt/${ts}.export.CSV.zip`;
  let archivedFileKey: string | null = fileKey;
  try {
    await uploadRaw(fileKey, rawZip);
    await job.log(`Archived raw ZIP to ${fileKey}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await job.log(`Archive upload failed (non-fatal): ${msg}`);
    archivedFileKey = null;
  }
  await job.updateProgress(40);

  // Record the ingest run
  const ingest = await prisma.rawIngest.create({
    data: { source: SOURCE, fileKey: archivedFileKey, rowCount: rows.length, meta: { exportUrl } },
  });

  // Upsert events with progress
  let upserted = 0;
  let rowErrors = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      await prisma.osintEvent.upsert({
        where: {
          source_sourceEventId: { source: SOURCE, sourceEventId: row.globalEventId },
        },
        create: {
          source: SOURCE,
          sourceEventId: row.globalEventId,
          eventCode: row.eventCode,
          eventDate: new Date(`${row.day.slice(0, 4)}-${row.day.slice(4, 6)}-${row.day.slice(6, 8)}`),
          actor1: row.actor1Name,
          actor2: row.actor2Name || null,
          lat: row.lat,
          lon: row.lon,
          countryCode: row.countryCode || null,
          numMentions: row.numMentions,
          avgTone: row.avgTone,
          sourceUrl: row.sourceUrl || null,
          ingestId: ingest.id,
        },
        update: {
          numMentions: row.numMentions,
          avgTone: row.avgTone,
        },
      });
      upserted++;
    } catch (e) {
      rowErrors++;
      if (rowErrors <= 5) {
        const msg = e instanceof Error ? e.message : String(e);
        await job.log(`Row ${i} (${row.globalEventId}) failed: ${msg}`);
      }
    }

    if (i % 50 === 0) {
      await job.updateProgress(40 + Math.round((i / rows.length) * 40));
    }
  }

  if (rowErrors > 5) {
    await job.log(`... and ${rowErrors - 5} more row errors suppressed`);
  }
  await job.log(`Upserted ${upserted}/${rows.length} events (${rowErrors} errors)`);
  await job.updateProgress(80);

  // Derive map features — store position-only geometry (honest about GDELT data)
  const strikes = buildStrikes(rows);
  const heatPoints = buildHeatPoints(rows);

  const sourceEventIds = rows.map((r) => r.globalEventId);
  await prisma.mapFeature.deleteMany({
    where: { source: SOURCE, sourceEventId: { in: sourceEventIds } },
  });

  const featureRecords = [
    ...strikes.map((s) => ({
      featureType: 'STRIKE_ARC',
      sourceEventId: s.sourceEventId,
      actor: s.actor,
      priority: s.priority,
      category: 'KINETIC',
      type: s.type,
      status: 'COMPLETE',
      timestamp: new Date(s.timestamp),
      geometry: { position: s.position },
      properties: { label: s.label, severity: s.severity },
      source: SOURCE,
    })),
    ...heatPoints.map((h) => ({
      featureType: 'HEAT_POINT',
      sourceEventId: h.sourceEventId,
      actor: h.actor,
      priority: h.priority,
      category: 'KINETIC',
      type: 'HEAT',
      status: null as string | null,
      timestamp: null as Date | null,
      geometry: { position: h.position },
      properties: { weight: h.weight },
      source: SOURCE,
    })),
  ];

  if (featureRecords.length > 0) {
    await prisma.mapFeature.createMany({ data: featureRecords });
  }
  await job.updateProgress(95);

  await upsertSync(exportUrl, 'ok', null, upserted, upserted);
  await job.updateProgress(100);
  await job.log(`Done: ${upserted} events, ${featureRecords.length} map features in ${Date.now() - start}ms`);

  return {
    status: 'ok',
    exportUrl,
    rowsParsed: rows.length,
    eventsUpserted: upserted,
    featuresCreated: featureRecords.length,
    archivedFileKey,
    durationMs: Date.now() - start,
  };
}

async function upsertSync(
  cursor: string,
  status: string,
  error: string | null,
  lastRunCount: number,
  totalDelta: number,
) {
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: {
      source: SOURCE,
      lastCursor: cursor,
      lastRunAt: new Date(),
      lastRunStatus: status,
      lastError: error,
      lastRunCount,
      totalEvents: totalDelta,
    },
    update: {
      lastCursor: cursor,
      lastRunAt: new Date(),
      lastRunStatus: status,
      lastError: error,
      lastRunCount,
      totalEvents: { increment: totalDelta },
    },
  });
}
