# OSINT Map — Web Beta

Experimental frontend for exploring OSINT data from the Pharos ingestion backend. Built for testing and iterating on the map experience while the OSINT service is still in active development.

This is **not** a production deployment target. It will be merged into a proper monorepo with multiple connected frontend apps in the future.

## Stack

- Next.js 16 (App Router)
- DeckGL v9 + MapLibre GL
- Redux Toolkit (view state, layer toggles)
- TanStack Query v5 (data fetching)
- milsymbol (MIL-STD-2525 military symbology)

## Running

Requires the OSINT backend running on port 4000.

```bash
cd osint/web_beta
npm install
npm run dev     # http://localhost:4173
```

## What it shows

- 9 toggleable data layers: reference installations, GDELT conflict events, FIRMS thermal hotspots, EONET natural disasters, USGS earthquakes, OpenSky military flights, Overpass military sites, world ports, AIS vessel positions
- NASA nightlights raster overlay (dual daily + snapshot tiles)
- MIL-STD-2525 military symbology icons with heading rotation for aircraft and vessels
- Click-to-inspect detail panel showing all provider fields
- Request timing waterfall for performance monitoring
