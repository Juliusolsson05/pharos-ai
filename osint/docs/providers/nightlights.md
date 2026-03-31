# Nighttime Lights (NASA Black Marble)

## Source
- **URL**: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/{date}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`
- **Format**: PNG tiles (256x256)
- **Auth**: None (GIBS WMTS is fully public)
- **Rate limit**: 100 concurrent requests (NASA documented limit)
- **Update frequency**: Daily (may have 1-2 day data latency)
- **Coverage**: Full world at zoom level 8 (65,536 tiles)

## Poll interval
24 hours — daily ingest of the full global tile set.

## What we store

Two products per tile, stored together:

### Display tiles (S3/MinIO)
- 256x256 WebP images in the `osint-tiles` bucket
- Key format: `nightlights/{date}/{z}/{x}/{y}.webp`
- Quality-tiered by region:
  - Iran (lat 24-40, lon 44-64): quality 92
  - Middle East (lat 12-45, lon 20-75): quality 82
  - Rest of world: quality 60
- Served directly via API without DB lookup

### ML tiles (Postgres)
- 32x32 uint8 grayscale pixel arrays stored as `bytea` (1,024 bytes each)
- `avgRadiance` pre-computed for fast SQL queries
- Used for pattern detection, blackout analysis, threat corridor identification

## Prisma model

```
NightlightTile {
  id          String   — cuid
  date        String   — "2026-02-27"
  z           Int      — zoom level (always 8)
  x           Int      — tile x coordinate (0-255)
  y           Int      — tile y coordinate (0-255)
  region      String   — "iran" | "middle-east" | "world"
  s3Key       String   — S3 key for display tile
  mlPixels    Bytes    — 32x32 uint8 grayscale (1,024 bytes)
  avgRadiance Float    — mean pixel brightness (0-255)
}

Unique: [date, z, x, y]
```

## Storage estimates

| Product | Per day | Per year |
|---------|---------|----------|
| Display tiles (WebP) | ~53 MB | ~19 GB |
| ML tiles (32x32 bytea) | ~25 MB | ~9 GB |
| DB overhead | ~15 MB | ~5 GB |
| **Total** | **~93 MB** | **~34 GB** |

## Performance

Daily ingest uses a streaming pipeline with two concurrency controls:
- **Fetch**: `p-limit(25)` parallel HTTP downloads from NASA GIBS
- **Process**: `p-limit(3)` parallel sharp operations (prevents memory fragmentation)
- **sharp.concurrency(4)**: libvips internal threading per image

Estimated timing:
- Daily run (65,536 tiles): ~10 minutes
- 30-day backfill: ~5 hours (runs at low priority)

## API endpoints

| Endpoint | What |
|----------|------|
| `GET /api/nightlights/:date/:z/:x/:y.webp` | Serve display tile from S3 |
| `GET /api/nightlights/dates` | List available dates |
| `GET /api/nightlights/anomalies?from=...&to=...&threshold=15` | Radiance change detection |

## Backfill

```bash
npm run seed -- --provider nightlights --from 2026-02-27
```

This enqueues one BullMQ job per date at priority 10 (below live ingestion).
The seed script lives in `src/providers/nightlights/seed.ts`.

## OSINT relevance

- **Blackout detection**: power grid strikes cause measurable radiance drops
- **Infrastructure damage**: compare pre/post-strike light output at specific sites
- **Economic activity**: industrial/port lighting changes indicate sanctions impact
- **Military activity**: unusual lighting patterns at bases or installations
- **Conflict tracking**: temporal analysis of light levels across the theater
