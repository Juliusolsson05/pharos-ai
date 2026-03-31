# Tile Mask (Support Data — GSHHG + Natural Earth)

## What this is

Support data, not an OSINT ingest provider. A one-time compute pipeline that determines which z8 map tiles contain inhabited land. Other providers (nightlights) read from this table to avoid fetching ocean/polar/empty tiles.

## Data sources

- **GSHHG** (Global Self-consistent Hierarchical High-resolution Geography) — coastline polygons that define land vs ocean. Intermediate resolution (~3.35 MB). From NOAA.
- **Natural Earth 10m populated places** — ~7,000 city/town point locations with population data. From naturalearthdata.com.
- **Strategic chokepoints** — hardcoded list of tiles covering Hormuz, Suez, Bab el-Mandeb, Malacca, etc.

## How it works

1. Downloads both shapefiles, parses to GeoJSON
2. Pre-indexes coastline polygons into a coarse spatial grid
3. Pre-indexes populated places into z8 tile keys
4. For each of the 65,536 z8 tiles, computes:
   - `hasLand` — does any coastline polygon bbox overlap this tile?
   - `hasPopulation` — does any populated place fall in this tile?
   - `isStrategic` — is this tile a known chokepoint?
   - `include` = `hasLand AND (hasPopulation OR isStrategic)`

## How to run

```bash
npm run seed -- --provider tile-mask
```

Expected runtime: 30-90 seconds. Expected result: ~12,000-15,000 included tiles.

## Prisma model

```
TileMask {
  z, x, y           — tile coordinates (unique)
  hasLand            — coastline polygon overlaps this tile
  hasPopulation      — populated place exists in this tile
  isStrategic        — hardcoded chokepoint
  include            — materialized: hasLand AND (hasPopulation OR isStrategic)
  landCoveragePct    — future use
  qualityTier        — "iran" | "middle-east" | "world"
}
```

## Consumers

- `ingest-nightlights.ts` calls `getIncludedTiles()` which reads `WHERE include = true` from this table
- Falls back to all 65,536 tiles if the table is empty (tile-mask hasn't been run yet)

## When to recompute

Rarely. Coastlines don't change. Recompute only if:
- You add new strategic chokepoints
- You change the quality tier definitions
- Natural Earth releases a significantly updated dataset
