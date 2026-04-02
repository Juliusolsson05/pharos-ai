# OSINT Jobs System

How the ingestion pipeline works and how to write jobs correctly.

## Stack

| Component | Purpose |
|-----------|---------|
| BullMQ | Job queue — scheduling, retries, concurrency |
| Redis | BullMQ backend (port 6382 locally) |
| Bull Board | Web UI at `/admin/queues` — logs, progress, results |

## Writing a job processor

Every job processor must follow these rules:

### 1. Use `job.log()`, not `console.log()`

`console.log()` goes to stdout only. `job.log()` persists to Redis and shows up in Bull Board's Logs tab for that specific job run.

```typescript
// wrong
console.log('Fetching data...');

// right
await job.log('Fetching data...');
```

Use `console.log/error` only for service-level messages (startup, shutdown). All job-specific output goes through `job.log()`.

### 2. Report progress with `job.updateProgress()`

Bull Board shows a progress bar for each job. Update it at meaningful steps:

```typescript
await job.updateProgress(10);  // after initial fetch
await job.updateProgress(30);  // after parsing
await job.updateProgress(80);  // after DB writes
await job.updateProgress(100); // done
```

For loops, update every N iterations to avoid Redis spam:

```typescript
for (let i = 0; i < rows.length; i++) {
  // ... process row ...
  if (i % 50 === 0) {
    await job.updateProgress(40 + Math.round((i / rows.length) * 40));
  }
}
```

### 3. Return a structured result

Never return `void`. The return value is stored in Redis and visible in Bull Board.

```typescript
type IngestResult = {
  status: 'ok' | 'skipped';
  exportUrl: string;
  rowsParsed: number;
  eventsUpserted: number;
  featuresCreated: number;
  archivedFileKey: string | null;
  durationMs: number;
};

export async function processMyIngest(job: Job): Promise<IngestResult> {
  const start = Date.now();
  // ...
  return {
    status: 'ok',
    exportUrl,
    rowsParsed: rows.length,
    eventsUpserted: upserted,
    featuresCreated: features.length,
    archivedFileKey: fileKey,
    durationMs: Date.now() - start,
  };
}
```

### 4. Let errors propagate for retries

Wrap the whole processor in try/catch. Log the error via `job.log()`, update the source sync, then **re-throw** so BullMQ can retry:

```typescript
export async function processMyIngest(job: Job): Promise<IngestResult> {
  try {
    // ... all processing ...
    return { status: 'ok', ... };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await job.log(`Fatal error: ${msg}`);
    // Update source_syncs so the API reflects the failure
    await upsertSync('', 'error', msg, 0, 0);
    throw err; // BullMQ handles retry
  }
}
```

### 5. Log row-level failures without killing the job

Individual row failures should be logged but not crash the job. Cap verbose logging to avoid Redis bloat:

```typescript
let rowErrors = 0;
for (const row of rows) {
  try {
    await prisma.osintEvent.upsert({ ... });
  } catch (e) {
    rowErrors++;
    if (rowErrors <= 5) {
      await job.log(`Row ${row.id} failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
if (rowErrors > 5) {
  await job.log(`... and ${rowErrors - 5} more row errors suppressed`);
}
```

## Registering a job

Jobs are registered in `src/jobs/scheduler.ts`. Always include retry config:

```typescript
const JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 50,  // keep last 50 completed jobs in Bull Board
  removeOnFail: 50,      // keep last 50 failed jobs for debugging
};

await ingestQueue.add('my-source', { source: 'my-source' }, {
  repeat: { every: 15 * 60 * 1000 },
  ...JOB_OPTS,
});
```

When cleaning up stale repeatable jobs on startup, only remove jobs by name — not everything:

```typescript
const existing = await ingestQueue.getRepeatableJobs();
for (const job of existing) {
  if (job.name === 'my-source') {
    await ingestQueue.removeRepeatableByKey(job.key);
  }
}
```

## Worker event handlers

The worker in `server.ts` must have all three handlers:

```typescript
worker.on('completed', (job, result) => {
  console.log(`[worker] ${job.name} completed:`, JSON.stringify(result));
});

worker.on('failed', (job, err) => {
  console.error(`[worker] ${job?.name} failed:`, err.message);
});

// CRITICAL — without this, the worker can crash silently
worker.on('error', (err) => {
  console.error('[worker] Error:', err);
});
```

## Source sync tracking

Every provider updates `osint.source_syncs` with two count fields:

| Field | Meaning |
|-------|---------|
| `lastRunCount` | Events upserted in the most recent job run |
| `totalEvents` | Cumulative total across all runs (incremented) |

This makes the health API unambiguous — you can tell if the last run was small vs. the source being new.

## Bull Board

Available at `http://localhost:4000/admin/queues`. Shows:

- **Job list** — waiting, active, completed, failed, delayed
- **Logs tab** — all `job.log()` entries with timestamps
- **Progress bar** — from `job.updateProgress()`
- **Return value** — structured JSON from the processor return
- **Error stack** — full error when a job fails
- **Retry** — manually retry failed jobs from the UI

## Adding a new provider

1. **Write the spec first**: Create `docs/providers/{name}.md` documenting every field the API returns, the endpoint URL, auth, rate limits, and what we map to. This is mandatory — no provider without a spec.
2. Create `src/providers/{name}/` with `fetch.ts`, `transform.ts`, `index.ts`
3. Create `src/jobs/ingest-{name}.ts` following the patterns above
4. **Always store raw JSON**: Every record must include a `raw Json` column containing the full unmodified source payload. Each provider has its own typed Prisma table — use typed columns for the fields you need, and `raw` as the safety net.
5. Register in `src/jobs/scheduler.ts`
6. Add the job name to the processor map in `server.ts`
7. Add env vars (if any) to `.env.example` and `config.ts`

### Raw data rule

Each provider's typed table must contain a `raw Json` column with **everything** the source gives us, even fields we don't currently use. The API and downstream transforms pick what they need from those typed tables, but the raw data is preserved. This lets us:
- Re-process historical data when we add new map feature types
- Debug data quality issues by comparing raw vs transformed
- Build new analytics without re-fetching from the source

## Adding a new stream

For sources that push data continuously (WebSocket, SSE, etc.) instead of responding to polls:

1. **Write the spec** in `docs/providers/{name}.md`
2. Create `src/streams/{name}/stream.ts` exporting a `StreamHandle`
3. Add it to the `ALL_STREAMS` array in `src/streams/index.ts`
4. Add env vars to `.env.example` and `config.ts`

A `StreamHandle` has: `name`, `enabled()`, `start()`, `stop()`, `status()`.

Streams run alongside the Express server. They accumulate data in memory and flush to the DB in batches (e.g. every 60 seconds). They are NOT BullMQ jobs — they manage their own lifecycle, reconnection, and error handling.
