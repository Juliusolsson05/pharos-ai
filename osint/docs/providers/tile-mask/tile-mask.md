# Tile Mask (Support Data)

## What this is

Support data, not an OSINT ingest provider. This compute pipeline determines which z8 map tiles contain meaningful inhabited or strategic land. Nightlights reads from this table to avoid fetching ocean, polar, and empty terrain tiles.

## Data sources

- **NASA GIBS OSM Land Water Map** — pixel-accurate land/water mask derived at z8 from z4 source tiles.
- **Natural Earth 10m populated places** — ~7,000 city/town point locations with population data. From naturalearthdata.com.
- **GHSL settlements** — global built-up / settlement density raster.
- **Strategic chokepoints** — hardcoded list of tiles covering Hormuz, Suez, Bab el-Mandeb, Malacca, etc.

## How it works

1. Seeds `land-mask`
2. Seeds `populated-places`
3. Seeds `settlements`
4. Computes strategic tile membership in-memory
5. For each of the 65,536 z8 tiles, computes:
   - `hasLand` — land mask says the tile contains land
   - `hasSettlement` — GHSL says the tile contains built-up area
   - `hasPopulation` — a populated place falls in the tile
   - `isStrategic` — the tile is a hardcoded chokepoint
   - `include` = `hasLand AND (meaningful settlement OR populated place OR strategic)`

## How to run

```bash
npm run seed -- --provider tile-mask
```

Expected runtime: 30-90 seconds after the support datasets are present.

## Prisma model

```
TileMask {
  z, x, y           — tile coordinates (unique)
  hasLand            — land mask says the tile contains land
  hasSettlement      — GHSL sees settlement pixels in the tile
  hasPopulation      — populated place exists in this tile
  isStrategic        — hardcoded chokepoint
  include            — materialized: hasLand AND (settlement OR population OR strategic)
  landCoveragePct    — future use
  qualityTier        — "iran" | "middle-east" | "world"
}
```

## Consumers

- `ingest-nightlights.ts` calls `getIncludedTiles()` which reads `WHERE include = true` from this table
- If this table is empty, `nightlights-daily` fails fast instead of fetching the full globe

## When to recompute

Rarely. Recompute only if:
- You add new strategic chokepoints
- You change the quality tier definitions
- Natural Earth or GHSL release a significantly updated dataset
