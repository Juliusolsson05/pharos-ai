import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { uploadRaw } from '../../../lib/storage.js';
import {
  fetchLatestExportUrl,
  downloadAndParse,
} from '../../../providers/gdelt/index.js';

const SOURCE = 'gdelt';

export async function processGdeltIngest(job: Job) {
  const start = Date.now();

  await job.log('Resolving latest GDELT export URL');
  const exportUrl = await fetchLatestExportUrl();
  await job.log(`Export URL: ${exportUrl}`);
  await job.updateProgress(10);

  const sync = await prisma.sourceSync.findUnique({ where: { source: SOURCE } });
  if (sync?.lastCursor === exportUrl) {
    await job.log('Already ingested this export, skipping');
    return { status: 'skipped', exportUrl, durationMs: Date.now() - start };
  }

  const { rows, rawZip } = await downloadAndParse(exportUrl);
  await job.log(`Parsed ${rows.length} conflict events`);
  await job.updateProgress(30);

  if (rows.length === 0) {
    await upsertSync(exportUrl, 'ok', null, 0, 0);
    return { status: 'ok', exportUrl, rows: 0, durationMs: Date.now() - start };
  }

  // Archive raw ZIP
  const ts = exportUrl.match(/(\d{14})/)?.[1] || Date.now().toString();
  const fileKey = `gdelt/${ts}.export.CSV.zip`;
  try { await uploadRaw(fileKey, rawZip); } catch { /* non-fatal */ }
  await job.updateProgress(40);

  const ingest = await prisma.rawIngest.create({
    data: { source: SOURCE, fileKey, rowCount: rows.length, meta: { exportUrl } },
  });

  // Write to typed gdelt_events table
  let upserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const c = r.raw; // all 61 columns
    try {
      await prisma.gdeltEvent.upsert({
        where: { globalEventId: r.globalEventId },
        create: {
          globalEventId: c[0],
          day: parseInt(c[1]) || 0,
          monthYear: parseInt(c[2]) || 0,
          year: parseInt(c[3]) || 0,
          fractionDate: parseFloat(c[4]) || 0,
          actor1Code: c[5] || null,
          actor1Name: c[6] || null,
          actor1CountryCode: c[7] || null,
          actor1KnownGroupCode: c[8] || null,
          actor1EthnicCode: c[9] || null,
          actor1Religion1Code: c[10] || null,
          actor1Religion2Code: c[11] || null,
          actor1Type1Code: c[12] || null,
          actor1Type2Code: c[13] || null,
          actor1Type3Code: c[14] || null,
          actor2Code: c[15] || null,
          actor2Name: c[16] || null,
          actor2CountryCode: c[17] || null,
          actor2KnownGroupCode: c[18] || null,
          actor2EthnicCode: c[19] || null,
          actor2Religion1Code: c[20] || null,
          actor2Religion2Code: c[21] || null,
          actor2Type1Code: c[22] || null,
          actor2Type2Code: c[23] || null,
          actor2Type3Code: c[24] || null,
          isRootEvent: c[25] === '1',
          eventCode: c[26] || '',
          eventBaseCode: c[27] || null,
          eventRootCode: c[28] || null,
          quadClass: parseInt(c[29]) || null,
          goldsteinScale: parseFloat(c[30]) || null,
          numMentions: parseInt(c[31]) || 1,
          numSources: parseInt(c[32]) || 1,
          numArticles: parseInt(c[33]) || 1,
          avgTone: parseFloat(c[34]) || 0,
          actor1GeoType: parseInt(c[35]) || null,
          actor1GeoFullName: c[36] || null,
          actor1GeoCountryCode: c[37] || null,
          actor1GeoAdm1Code: c[38] || null,
          actor1GeoAdm2Code: c[39] || null,
          actor1GeoLat: parseFloat(c[40]) || null,
          actor1GeoLon: parseFloat(c[41]) || null,
          actor1GeoFeatureId: c[42] || null,
          actor2GeoType: parseInt(c[43]) || null,
          actor2GeoFullName: c[44] || null,
          actor2GeoCountryCode: c[45] || null,
          actor2GeoAdm1Code: c[46] || null,
          actor2GeoAdm2Code: c[47] || null,
          actor2GeoLat: parseFloat(c[48]) || null,
          actor2GeoLon: parseFloat(c[49]) || null,
          actor2GeoFeatureId: c[50] || null,
          actionGeoType: parseInt(c[51]) || null,
          actionGeoFullName: c[52] || null,
          actionGeoCountryCode: c[53] || null,
          actionGeoAdm1Code: c[54] || null,
          actionGeoAdm2Code: c[55] || null,
          actionGeoLat: r.lat,
          actionGeoLon: r.lon,
          actionGeoFeatureId: c[58] || null,
          dateAdded: c[59] || null,
          sourceUrl: c[60] || null,
          raw: c,
          ingestId: ingest.id,
        },
        update: {
          numMentions: parseInt(c[31]) || 1,
          avgTone: parseFloat(c[34]) || 0,
          raw: c,
        },
      });
      upserted++;
    } catch {
      errors++;
      if (errors <= 3) await job.log(`Row ${i} failed (${r.globalEventId})`);
    }
    if (i % 50 === 0) await job.updateProgress(40 + Math.round((i / rows.length) * 40));
  }
  await job.log(`Upserted ${upserted}/${rows.length} events (${errors} errors)`);
  await job.updateProgress(80);

  await upsertSync(exportUrl, 'ok', null, upserted, upserted);
  await job.updateProgress(100);
  await job.log(`Done: ${upserted} events in ${Date.now() - start}ms`);
  return { status: 'ok', exportUrl, upserted, durationMs: Date.now() - start };
}

async function upsertSync(cursor: string, status: string, error: string | null, last: number, delta: number) {
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: cursor, lastRunAt: new Date(), lastRunStatus: status, lastError: error, lastRunCount: last, totalEvents: delta },
    update: { lastCursor: cursor, lastRunAt: new Date(), lastRunStatus: status, lastError: error, lastRunCount: last, totalEvents: { increment: delta } },
  });
}
