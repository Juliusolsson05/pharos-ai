import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';

import { prisma } from '../db.js';
import { getTile } from '../lib/storage.js';
import { config } from '../config.js';

const DATE = process.argv[2] || '2026-02-27';
const OUT = process.argv[3] || '/tmp/nightlights-static';
const BUCKET = config.nightlights.tileBucket;

async function main() {
  // Daily tiles
  const dailyRows = await prisma.nightlightTile.findMany({
    where: { date: DATE },
    select: { z: true, x: true, y: true, s3Key: true },
  });
  console.log(`Daily rows for ${DATE}: ${dailyRows.length}`);

  let dOk = 0;
  for (const r of dailyRows) {
    const dir = `${OUT}/daily/${r.z}/${r.x}`;
    mkdirSync(dir, { recursive: true });
    const buf = await getTile(BUCKET, r.s3Key);
    if (buf) {
      writeFileSync(`${dir}/${r.y}.webp`, buf);
      dOk++;
    }
    if (dOk % 500 === 0 && dOk > 0) console.log(`  daily: ${dOk}/${dailyRows.length}`);
  }
  console.log(`Daily written: ${dOk}`);

  // Snapshot tiles
  const snapRows = await prisma.nightlightSnapshot.findMany({
    where: { date: DATE },
    select: { z: true, x: true, y: true, s3Key: true },
  });
  console.log(`Snapshot rows for ${DATE}: ${snapRows.length}`);

  let sOk = 0;
  for (const r of snapRows) {
    const dir = `${OUT}/snapshots/${r.z}/${r.x}`;
    mkdirSync(dir, { recursive: true });
    const buf = await getTile(BUCKET, r.s3Key);
    if (buf) {
      writeFileSync(`${dir}/${r.y}.webp`, buf);
      sOk++;
    }
    if (sOk % 500 === 0 && sOk > 0) console.log(`  snapshot: ${sOk}/${snapRows.length}`);
  }
  console.log(`Snapshot written: ${sOk}`);

  await prisma.$disconnect();
}

main();
