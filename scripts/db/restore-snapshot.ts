import { pathToFileURL } from 'node:url';

import { run } from './lib/exec';
import { snapshotPath } from './lib/metadata';
import { INCLUDED_SQL, SNAPSHOT_DUMP } from './manifest';

const CONTAINER_TMP = '/tmp/pharos-db-snapshot.dump';

function compose(args: string[]) {
  return run({ command: 'docker', args: ['compose', ...args] });
}

export async function restoreSnapshot() {
  compose(['up', '-d', 'postgres']);
  const serviceState = compose(['ps', '-q', 'postgres']);
  if (!serviceState) throw new Error('Local postgres container is not running');
  compose(['cp', snapshotPath(SNAPSHOT_DUMP), `postgres:${CONTAINER_TMP}`]);
  const truncateSql = `TRUNCATE ${INCLUDED_SQL} RESTART IDENTITY CASCADE;`;
  compose(['exec', '-T', 'postgres', 'psql', '-U', 'pharos', '-d', 'pharos', '-c', truncateSql]);
  compose([
    'exec',
    '-T',
    'postgres',
    'pg_restore',
    '-U',
    'pharos',
    '-d',
    'pharos',
    '--data-only',
    '--disable-triggers',
    '--no-owner',
    '--no-privileges',
    CONTAINER_TMP,
  ]);
  compose(['exec', '-T', 'postgres', 'rm', '-f', CONTAINER_TMP]);
}

async function main() {
  await restoreSnapshot();
  console.log('Restored latest public snapshot into local postgres');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  void main();
}
