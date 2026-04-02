# Pharos OSINT Service

> **Beta / In Development** — This package is under active development. APIs, schemas, and provider coverage are changing frequently. Not yet deployed to production.

Standalone data ingestion backend for the OSINT map mode. Pulls from public OSINT sources, normalizes events, and writes map-ready features to a dedicated `osint` schema in the shared PostgreSQL database.

The `web_beta/` directory contains an experimental Next.js frontend for exploring OSINT data on a map. It will be merged into a proper monorepo structure with multiple connected frontend apps in the future.

## Background

Pharos has two map modes, toggled on the same page:

**Aggregated mode** is the default. It shows AI-curated, high-confidence map features synthesized from multiple news and intelligence sources. This is what most users see — clean, focused, fewer features with editorial judgment applied. The data lives in the main app's `public` database schema and is served by the Next.js backend on Vercel.

**OSINT mode** is the complement. It pulls directly from as many public open-source intelligence feeds as possible and presents everything on the map — raw, unfiltered, high-volume. Where aggregated mode might show 50 curated events for a day, OSINT mode shows thousands of data points from satellite thermal detections, conflict event databases, military installation registries, and maritime warning systems. The data is completely separate: different database schema (`osint.*`), different backend, different API.

This kind of raw OSINT map is more common in the open-source intelligence community — projects like WorldMonitor, Shadowbroker, and OSINT-War-Room take a similar approach. It may not suit every user, but for analysts who want to see everything and draw their own conclusions, it provides a level of transparency and density that curated feeds cannot.

Because OSINT mode aggregates many sources with different formats, update frequencies, and reliability levels, it needs its own dedicated ingestion stack:

- **Express** serves the API that the frontend reads from
- **BullMQ** schedules recurring ingest jobs with retries and exponential backoff
- **Redis** backs the job queue and provides caching
- **Prisma** manages the `osint` schema in the shared PostgreSQL database
- **S3-compatible storage** (MinIO locally, Cloudflare R2 in production) archives raw source files for traceability
- **Persistent streams** (WebSocket connections) handle real-time data sources like AIS vessel tracking

The goal is to continuously add more OSINT sources over time. Each source gets its own provider folder, its own ingest mechanism (BullMQ job or persistent stream), and its own typed database table.

## How it relates to the main app

| | Aggregated mode (Vercel) | OSINT mode (Railway) |
|---|---|---|
| Runtime | Next.js serverless | Express + persistent Node |
| Data source | AI fulfillment agent | Public OSINT feeds |
| DB schema | `public.*` | `osint.*` |
| Cache | Vercel edge | Redis |
| Map toggle | Default | User-selected |

The two schemas are independent. The OSINT service never touches `public.*` tables.

## Quick start

```bash
cd osint

# Start Redis + MinIO (local S3 bucket)
docker compose up -d

# Install deps + generate Prisma client
npm install
npx prisma generate
npx prisma db push

# Run
npm run dev
```

## URLs

| URL | What |
|-----|------|
| `localhost:4000/admin/queues` | Bull Board — job dashboard (logs, progress, results) |
| `localhost:4000/api/health` | Service health (DB, Redis, streams, all sources) |
| `localhost:4000/api/sources` | Per-source sync metadata |
| `localhost:4000/api/providers/{provider}/features` | Provider-specific derived features |
| `localhost:4000/api/providers/{provider}/raw` | Provider-specific raw typed rows |
| `localhost:4000/api/providers/{provider}/meta` | Provider freshness and counts |
| `localhost:9001` | MinIO console — browse raw archived files |

## Stack

| Tool | Purpose |
|------|---------|
| Express | HTTP API |
| BullMQ | Job scheduling, retries, worker coordination |
| Redis | BullMQ backend + cache |
| Prisma | ORM — `osint` schema in shared PostgreSQL |
| MinIO (local) / R2 (prod) | S3-compatible object storage for raw files |
| ws | WebSocket client for persistent streams |

## Directory structure

```
osint/
├── docker-compose.yml          # Redis + MinIO (separate from main app)
├── prisma/schema.prisma        # osint.* tables (per-provider typed models)
├── data/reference/             # Curated JSON datasets (Iranian/Israeli sites, vessels)
│   ├── installations/
│   └── vessels/
├── docs/
│   ├── JOBS.md                 # Job system practices
│   └── providers/              # One folder per source: spec doc + LICENSE.md
└── src/
    ├── server.ts               # Express + BullMQ worker + stream startup
    ├── config.ts               # Env-driven config
    ├── db.ts                   # Prisma client (osint schema)
    ├── queue.ts                # BullMQ queue + worker factory
    ├── types.ts                # Shared types (MapDataResponse, etc.)
    ├── api/
    │   ├── health.ts
    │   ├── sources.ts
    │   ├── nightlights/
    │   │   └── index.ts
    │   └── providers/
    │       ├── index.ts
    │       ├── provider-router.ts
    │       ├── provider-helpers.ts
    │       ├── gdelt/
    │       ├── firms/
    │       ├── opensky/
    │       └── ...
    ├── providers/              # One folder per polling data source
    │   ├── gdelt/              # GDELT 2.0 conflict events (CSV exports)
    │   ├── firms/              # NASA FIRMS thermal hotspots
    │   ├── overpass/           # OSM military installations
    │   ├── nga/                # NGA navigational warnings
    │   ├── usgs/               # USGS earthquakes
    │   ├── ucdp/               # UCDP conflict data
    │   ├── opensky/            # OpenSky military flights (ICAO hex)
    │   ├── gpsjam/             # Wingbits GPS interference
    │   ├── oref/               # Israel Home Front Command alerts
    │   ├── mirta/              # US DoD installations (ArcGIS)
    │   ├── eonet/              # NASA EONET + GDACS natural disasters
    │   ├── safecast/           # Radiation monitoring
    │   ├── submarine-cables/   # TeleGeography cable routes
    │   ├── cloudflare-radar/   # Internet outage detection
    │   ├── nightlights/        # NASA Black Marble tiles + display pipeline
    │   ├── ports/              # NGA World Port Index (Pub 150)
    │   ├── power-plants/       # WRI Global Power Plant Database
    │   ├── geodata/            # land-mask / settlements / populated places / tile-mask
    │   └── reference/          # Curated JSON reference data
    ├── streams/                # Persistent connections (WebSocket, etc.)
    │   ├── types.ts            # StreamHandle interface
    │   ├── index.ts            # Stream registry (startAll/stopAll)
    │   └── aisstream/          # AIS vessel tracking WebSocket
    ├── jobs/                   # BullMQ job processors
    │   ├── ingest-gdelt.ts
    │   ├── ingest-firms.ts
    │   ├── ingest-overpass.ts
    │   ├── ingest-nga.ts
    │   ├── ingest-usgs.ts
    │   ├── ingest-ucdp.ts
    │   ├── ingest-opensky.ts
    │   ├── ingest-gpsjam.ts
    │   ├── ingest-oref.ts
    │   ├── ingest-mirta.ts
    │   ├── ingest-eonet.ts
    │   ├── ingest-safecast.ts
    │   ├── ingest-submarine-cables.ts
    │   ├── ingest-cloudflare-radar.ts
    │   ├── ingest-nightlights.ts
    │   ├── ingest-nightlights-snapshot.ts
    │   ├── ingest-ports.ts
    │   ├── ingest-power-plants.ts
    │   ├── ingest-tile-mask.ts
    │   ├── ingest-reference.ts
    │   └── scheduler.ts
    └── lib/
        ├── api-utils.ts        # ok()/err() response envelope
        └── storage.ts          # S3/MinIO upload
```

## Data ingestion patterns

The service has two ingestion patterns:

**Jobs** (BullMQ) — for sources that expose a REST API or downloadable file. Each job runs on a schedule, fetches data, writes to a typed provider table, and derives map features. Jobs have retries, exponential backoff, progress tracking, and structured results visible in Bull Board.

**Streams** (persistent connections) — for sources that push data continuously via WebSocket or similar protocols. Streams run alongside the Express server, accumulate data in memory, and flush to the DB in batches. They reconnect automatically on disconnect.

## API envelope

All responses use `{ ok, data }` / `{ ok: false, error: { code, message } }`.

## API structure

The OSINT API is provider-first.

- Service endpoints stay at the top level:
  - `/api/health`
  - `/api/sources`
- Nightlights remains its own module under `/api/nightlights/...`
- Source data is exposed under `/api/providers/{provider}/...`

Each provider exposes up to three endpoints:

- `GET /api/providers/{provider}/features`
  - Derived features for that provider from `osint.map_features`
- `GET /api/providers/{provider}/raw`
  - Raw rows from the provider's typed table when available
- `GET /api/providers/{provider}/meta`
  - Counts plus `source_syncs` freshness metadata

## Current sources

### Polling providers (BullMQ jobs)

| Source | Layer | Interval | Auth | Status |
|--------|-------|----------|------|--------|
| GDELT 2.0 CSV | Strikes + heat points | 15 min | None | Active |
| NASA FIRMS | Heat points (thermal) | 30 min | Free MAP_KEY | Active |
| OSM Overpass | Military installations (4,500+) | 24h | None | Active |
| NGA Nav Warnings | Maritime threat zones (245) | 6h | None | Active |
| USGS Earthquakes | Seismic events | 1h | None | Active |
| UCDP GED | Conflict events | 6h | Needs token | Blocked |
| OpenSky Network | Military flights (ICAO hex) | 5 min | None | Active |
| GPSJam / Wingbits | GPS interference zones | 30 min | Free API key | Needs key |
| OREF | Israel siren alerts | 2 min | None | Active |
| MIRTA (US Army Corps) | US DoD installations (737) | 7 days | None | Active |
| EONET + GDACS | Natural disasters (400+) | 2h | None | Active |
| Safecast | Radiation monitoring | 2h | None | Active |
| Submarine cables | Cable routes + landing points | 7 days | None | Active |
| Cloudflare Radar | Internet outages (ME) | 30 min | Free CF token | Needs token |
| NGA World Port Index | Global ports + terminals (3,800) | 30 days | None | Active |
| WRI Power Plants | Global power plants (34,900) | 30 days | None | Active |
| Reference data | Curated Iranian/Israeli/vessel data | 24h | None | Active |

### Persistent streams

| Source | What | Protocol |
|--------|------|----------|
| AISStream | Vessel positions (100+ ME vessels) | WebSocket |

## Database

Each provider has its own typed Prisma table (e.g. `gdelt_events`, `firms_detections`, `mirta_sites`, `ais_positions`). Every table includes a `raw Json` column preserving the full unmodified source payload. Provider APIs expose either derived `map_features`, typed raw rows, or both depending on the source.

See `prisma/schema.prisma` for the full schema.

## Environment variables

See `.env.example`. All have sensible local defaults in `config.ts`.

## Adding a new provider

Every provider must have a corresponding folder in `docs/providers/{name}/` with:

1. **`{name}.md`** — spec doc covering the data source, API endpoints, fields, update frequency, and mapping to map features
2. **`LICENSE.md`** — the data license for the source, verified from the provider's official website. Include the exact license name, attribution requirements, and links to the original terms. Do not guess or assume — if the license is unclear, document that explicitly.

## Docs

- [Job system practices](docs/JOBS.md) — how to write job processors, use `job.log()`, progress tracking, retries
- [Provider specs](docs/providers/) — per-source documentation and data licenses for every provider
