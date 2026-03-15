import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { run } from './lib/exec';
import { checksum, ensureSnapshotDir, snapshotPath, writeMetadata } from './lib/metadata';
import {
  EXCLUDED_TABLES,
  INCLUDED_TABLES,
  REQUIRED_TABLES,
  SNAPSHOT_DB_URL_ENV,
  SNAPSHOT_DUMP,
  SNAPSHOT_OWNER,
  SNAPSHOT_REPO,
  SNAPSHOT_TAG,
} from './manifest';

const PG_DUMP_BIN = process.env.PG_DUMP_BIN ?? 'pg_dump';
const PSQL_BIN = process.env.PSQL_BIN ?? 'psql';

async function latestMigration() {
  const dirs = await readdir('prisma/migrations', { withFileTypes: true });
  return dirs.filter(dir => dir.isDirectory()).map(dir => dir.name).sort().at(-1) ?? 'unknown';
}

function quoted(table: string) {
  return `public."${table}"`;
}

export async function publishSnapshot() {
  const databaseUrl = process.env[SNAPSHOT_DB_URL_ENV];
  if (!databaseUrl) throw new Error(`Missing ${SNAPSHOT_DB_URL_ENV}`);
  await ensureSnapshotDir();
  const dumpPath = snapshotPath(SNAPSHOT_DUMP);
  run({
    command: PG_DUMP_BIN,
    args: ['--data-only', '--format=custom', '--file', dumpPath, ...INCLUDED_TABLES.flatMap(table => ['-t', quoted(table)]), databaseUrl],
  });
  const rowCountsSql = INCLUDED_TABLES.map(table => `select '${table}', count(*) from ${quoted(table)};`).join(' ');
  const rows = run({ command: PSQL_BIN, args: [databaseUrl, '-At', '-c', rowCountsSql] });
  const rowCounts = Object.fromEntries(rows.split('\n').filter(Boolean).map(line => {
    const [table, count] = line.split('|');
    return [table, Number(count)];
  }));
  const metadata = {
    checksumSha256: await checksum(dumpPath),
    excludedTables: EXCLUDED_TABLES,
    formatVersion: 1 as const,
    generatedAt: new Date().toISOString(),
    includedTables: INCLUDED_TABLES,
    latestMigration: await latestMigration(),
    releaseTag: SNAPSHOT_TAG,
    repo: `${SNAPSHOT_OWNER}/${SNAPSHOT_REPO}`,
    requiredTables: REQUIRED_TABLES,
    rowCounts,
  };
  await writeMetadata(metadata);
}

async function main() {
  await publishSnapshot();
  console.log(`Snapshot artifacts ready in ${snapshotPath('')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  void main();
}
