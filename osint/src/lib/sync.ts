import { prisma } from '../db.js';

type SyncMode = 'append' | 'snapshot' | 'upsert';

type SyncUpdate = {
  source: string;
  mode: SyncMode;
  status: 'ok' | 'error';
  cursor?: string | null;
  lastRunCount: number;
  currentRows: number;
  error?: string | null;
};

/**
 * Standardized source sync update. Every job should call this at completion.
 *
 * - lastRunCount: rows processed in this specific run
 * - currentRows: actual row count in the typed table right now
 * - totalEvents: cumulative (incremented for append, set for snapshot/upsert)
 * - sourceMode: how this provider populates data
 */
export async function updateSync(update: SyncUpdate) {
  const now = new Date();
  const isAppend = update.mode === 'append';

  await prisma.sourceSync.upsert({
    where: { source: update.source },
    create: {
      source: update.source,
      lastCursor: update.cursor ?? null,
      lastRunAt: now,
      lastRunStatus: update.status,
      lastError: update.error ?? null,
      lastRunCount: update.lastRunCount,
      totalEvents: update.currentRows,
      sourceMode: update.mode,
      currentRows: update.currentRows,
    },
    update: {
      lastCursor: update.cursor ?? undefined,
      lastRunAt: now,
      lastRunStatus: update.status,
      lastError: update.error ?? null,
      lastRunCount: update.lastRunCount,
      totalEvents: isAppend
        ? { increment: update.lastRunCount }
        : update.currentRows,
      sourceMode: update.mode,
      currentRows: update.currentRows,
    },
  });
}
