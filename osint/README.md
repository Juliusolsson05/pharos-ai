# Pharos OSINT Service

Standalone data ingestion backend for the OSINT map mode. Pulls from public OSINT sources, normalizes events, and writes map-ready features to a dedicated `osint` schema in the shared PostgreSQL database.

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

The goal is to continuously add more OSINT sources over time. Each source gets its own provider folder, its own BullMQ job, and its own poll interval.

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
| `localhost:4000/api/health` | Service health |
| `localhost:4000/api/map-data` | Map-ready data (same shape as main app) |
| `localhost:4000/api/sources` | Per-source sync metadata |
| `localhost:9001` | MinIO console — browse raw archived files |

## Stack

| Tool | Purpose |
|------|---------|
| Express | HTTP API |
| BullMQ | Job scheduling, retries, worker coordination |
| Redis | BullMQ backend + cache |
| Prisma | ORM — `osint` schema in shared PostgreSQL |
| MinIO (local) / R2 (prod) | S3-compatible object storage for raw files |
| adm-zip | GDELT ZIP extraction |

## Directory structure

```
osint/
├── docker-compose.yml      # Redis + MinIO (separate from main app)
├── prisma/schema.prisma    # osint.* tables
├── docs/JOBS.md            # Job system practices
└── src/
    ├── server.ts           # Express + BullMQ worker entry
    ├── config.ts           # Env-driven config
    ├── db.ts               # Prisma client (osint schema)
    ├── queue.ts            # BullMQ queue + worker factory
    ├── types.ts            # Shared types (MapDataResponse, etc.)
    ├── api/
    │   ├── health.ts
    │   ├── map-data.ts
    │   └── sources.ts
    ├── providers/
    │   ├── gdelt/          # GDELT 2.0 conflict events (CSV exports)
    │   ├── firms/          # NASA FIRMS thermal hotspots
    │   ├── overpass/       # OSM military installations
    │   └── nga/            # NGA navigational warnings
    ├── jobs/
    │   ├── ingest-gdelt.ts
    │   ├── ingest-firms.ts
    │   ├── ingest-overpass.ts
    │   ├── ingest-nga.ts
    │   └── scheduler.ts
    └── lib/
        ├── api-utils.ts    # ok()/err() response envelope
        └── storage.ts      # S3/MinIO upload
```

## API envelope

All responses use `{ ok, data }` / `{ ok: false, error: { code, message } }` — same pattern as the main app.

## Current sources

| Source | Layer | Interval | Auth |
|--------|-------|----------|------|
| GDELT 2.0 CSV | Strikes + heat points | 15 min | None |
| NASA FIRMS | Heat points (thermal) | 30 min | Free MAP_KEY |
| OSM Overpass | Assets (bases, airfields) | 24h | None |
| NGA Nav Warnings | Threat zones (maritime) | 6h | None |

## Environment variables

See `.env.example`. All have sensible local defaults in `config.ts`.

## Docs

- [Job system practices](docs/JOBS.md) — how to write job processors correctly
