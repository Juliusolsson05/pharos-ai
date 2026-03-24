# Pharos OSINT Service

Standalone data ingestion backend for the OSINT map mode. Pulls from public OSINT sources, normalizes events, and writes map-ready features to a dedicated `osint` schema in the shared PostgreSQL database.

## How it relates to the main app

| | Main app (Vercel) | OSINT service (Railway) |
|---|---|---|
| Runtime | Next.js serverless | Express + persistent Node |
| Data source | AI fulfillment agent | Public OSINT feeds (GDELT, etc.) |
| DB schema | `public.*` | `osint.*` |
| Cache | Vercel edge | Redis |

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
    │   └── gdelt/          # One folder per provider
    │       ├── fetch.ts
    │       ├── transform.ts
    │       └── index.ts
    ├── jobs/
    │   ├── ingest-gdelt.ts # BullMQ job processor
    │   └── scheduler.ts    # Register recurring jobs
    └── lib/
        ├── api-utils.ts    # ok()/err() response envelope
        └── storage.ts      # S3/MinIO upload
```

## API envelope

All responses use `{ ok, data }` / `{ ok: false, error: { code, message } }` — same pattern as the main app.

## Current sources

| Source | Status | Interval | Data |
|--------|--------|----------|------|
| GDELT 2.0 CSV | Active | 15 min | Conflict events → strikes + heat points |

## Environment variables

See `.env.example`. All have sensible local defaults in `config.ts`.

## Docs

- [Job system practices](docs/JOBS.md) — how to write job processors correctly
