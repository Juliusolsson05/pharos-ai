import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { uploadRaw } from '../../../lib/storage.js';
import { downloadPopulatedPlaces, NAT_EARTH_VERSION } from './fetch.js';

const SOURCE = 'populated-places';
const BATCH_SIZE = 500;

export async function seed(_opts: { from?: string; to?: string; delay?: number }): Promise<void> {
  const start = Date.now();
  const s3Key = `geodata/natural-earth-populated-places-${NAT_EARTH_VERSION}.zip`;

  const existing = await prisma.sourceSync.findUnique({ where: { source: SOURCE } });
  if (existing?.lastCursor === NAT_EARTH_VERSION) {
    console.log(`[populated-places] Already seeded v${NAT_EARTH_VERSION}, skipping.`);
    return;
  }

  const { geojson, rawZip } = await downloadPopulatedPlaces();

  try { await uploadRaw(s3Key, rawZip); } catch { /* non-fatal */ }

  await prisma.rawIngest.upsert({
    where: { id: `${SOURCE}-${s3Key}` },
    create: { id: `${SOURCE}-${s3Key}`, source: SOURCE, fileKey: s3Key, rowCount: geojson.features.length, meta: { version: NAT_EARTH_VERSION } },
    update: { rowCount: geojson.features.length, fetchedAt: new Date() },
  });

  console.log(`[populated-places] Storing ${geojson.features.length} places...`);
  await prisma.populatedPlace.deleteMany({});

  for (let i = 0; i < geojson.features.length; i += BATCH_SIZE) {
    const batch = geojson.features.slice(i, i + BATCH_SIZE);
    await prisma.populatedPlace.createMany({
      data: batch.map((f) => {
        const p = f.properties || {};
        const coords = (f.geometry as GeoJSON.Point).coordinates;
        return {
          neId: BigInt(p.ne_id || 0),
          name: String(p.name || 'Unknown'),
          nameAscii: p.nameascii || null,
          lat: coords[1], lon: coords[0],
          popMax: p.pop_max != null ? Number(p.pop_max) : null,
          popMin: p.pop_min != null ? Number(p.pop_min) : null,
          scalerank: p.scalerank != null ? Number(p.scalerank) : null,
          labelrank: p.labelrank != null ? Number(p.labelrank) : null,
          featureClass: p.featurecla || null,
          countryName: p.adm0name || null,
          countryCode: p.iso_a2 || null,
          sovName: p.sov0name || null,
          adm1Name: p.adm1name || null,
          worldcity: p.worldcity === 1,
          megacity: p.megacity === 1,
          raw: toJson(p),
        };
      }),
    });
  }

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: NAT_EARTH_VERSION, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: geojson.features.length, totalEvents: geojson.features.length },
    update: { lastCursor: NAT_EARTH_VERSION, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: geojson.features.length, totalEvents: geojson.features.length },
  });

  console.log(`[populated-places] Done: ${geojson.features.length} places in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}
