import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchOrefAlerts, fetchOrefHistory } from '../../../providers/oref/index.js';

const SOURCE = 'oref';

export async function processOrefIngest(job: Job) {
  const start = Date.now();
  await job.log('Fetching OREF alerts (active + history)');

  const [active, history] = await Promise.all([fetchOrefAlerts(), fetchOrefHistory()]);
  await job.log(`Active: ${active.length}, History: ${history.length}`);
  await job.updateProgress(30);

  const seen = new Set<string>();
  const all = [...active, ...history].filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });

  // Write to typed oref_alerts table
  let stored = 0;
  for (const a of all) {
    try {
      await prisma.orefAlert.upsert({
        where: { alertId: a.id },
        create: {
          alertId: a.id, cat: a.cat, title: a.title || null,
          desc: a.desc || null, areas: a.data,
          alertDate: a.alertDate ? new Date(a.alertDate) : null,
          raw: toJson(a),
        },
        update: { raw: toJson(a) },
      });
      stored++;
    } catch { /* dedupe */ }
  }
  await job.updateProgress(60);

  await job.updateProgress(100);
  await job.log(`Done: ${stored} alerts in ${Date.now() - start}ms`);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });
  return { status: 'ok', raw: stored, durationMs: Date.now() - start };
}
