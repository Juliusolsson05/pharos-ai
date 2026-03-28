<p align="center">
  <img src="public/logo.svg" alt="Pharos" width="320" />
</p>

<p align="center">
  Open-source intelligence dashboard tracking the Iran conflict in real time.
  <br />
  <a href="https://conflicts.app"><strong>conflicts.app</strong></a>
</p>

<p align="center">
  <a href="https://github.com/Juliusolsson05/pharos-ai/stargazers"><img src="https://img.shields.io/github/stars/Juliusolsson05/pharos-ai?style=flat" alt="Stars"></a>
  <a href="https://github.com/Juliusolsson05/pharos-ai/network/members"><img src="https://img.shields.io/github/forks/Juliusolsson05/pharos-ai?style=flat" alt="Forks"></a>
  <a href="https://github.com/Juliusolsson05/pharos-ai/issues"><img src="https://img.shields.io/github/issues/Juliusolsson05/pharos-ai?style=flat" alt="Issues"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Juliusolsson05/pharos-ai?style=flat" alt="License"></a>
  <a href="https://github.com/Juliusolsson05/pharos-ai/commits/main"><img src="https://img.shields.io/github/last-commit/Juliusolsson05/pharos-ai?style=flat" alt="Last commit"></a>
  <a href="https://conflicts.app"><img src="https://img.shields.io/badge/live-conflicts.app-2D72D2?style=flat" alt="Live"></a>
</p>

---

<!-- TODO: Replace with GIF of the map dashboard -->

![Pharos dashboard](public/app_screenshot.png)

## Why this exists

Most [OSINT](https://en.wikipedia.org/wiki/Open-source_intelligence) (open-source intelligence) platforms do a decent job at surfacing individual events, but they fail at painting the full picture of a conflict. You get fragments — a strike here, a statement there — without the connective tissue that makes it possible to actually understand what's happening and why.

Pharos is built to fix that. Within an hour of exploring the dashboard you can get a comprehensive understanding of the entire conflict — every actor, every escalation chain, every diplomatic response — not just what happened in the last five minutes. It pulls from 30 feeds spanning Western, Iranian, Israeli, Arab, Russian, and Chinese outlets so you see the full picture, not one side of it.

Named after the [Lighthouse of Alexandria](https://en.wikipedia.org/wiki/Lighthouse_of_Alexandria), one of the Seven Wonders of the Ancient World — a beacon that cut through the noise to guide ships safely. That's the idea here.

## What it does

- **Live conflict map** — airstrikes, missile tracks, targets, military assets, and threat zones rendered on DeckGL + MapLibre with story-driven playback
- **Intel signals** — field reports from X/Twitter, news articles, and official statements with source verification
- **RSS monitor** — 30 feeds from Reuters and AP to Press TV and TASS, each labeled by bias and tier
- **Event timeline** — every incident tracked with severity, actor responses, and source citations
- **Actor dossiers** — profiles for every state and non-state actor, with capability snapshots and intelligence assessments
- **Daily briefs** — situation reports covering the last 24 hours
- **Economic data** — military spending, GDP, inflation, and armed forces via World Bank

## Tech stack

Next.js 16 · React 19 · TypeScript · DeckGL · MapLibre · Prisma 7 · PostgreSQL 17 · Tailwind CSS · Vercel

## Local setup

```bash
cp .env.local.example .env.local
npm install
npm run setup
npm run dev
```

`npm run setup` starts local Postgres, applies migrations, and restores the latest public database snapshot. If the snapshot is unavailable it falls back to the deterministic seed dataset.

Requires Node 22 and Docker. If you have an older Postgres 16 Docker volume, run `docker compose down -v` once before setup.

## Open source

This repository contains the full application — dashboard, API routes, map, and all supporting frontend and server code. The agent layer that ingests and curates conflict data is maintained separately and will be open-sourced as it stabilises. The app runs independently using the public snapshot system for data.

## License

[AGPL-3.0-only](LICENSE)

---

<a href="https://conflicts.app">
  <img src="public/og-image-1200x630.jpg" alt="conflicts.app — live geopolitical intelligence dashboard" width="100%" />
</a>

---

## How it works

Pharos tracks a conflict through a few core concepts:

- **Conflicts** — the top-level entity. Everything else belongs to a conflict.
- **Intel events** — individual incidents (strikes, statements, movements) with severity, timestamps, and source citations.
- **Actors** — state and non-state participants. Each actor has capability snapshots, actions, and day-level assessments.
- **X posts** — social media signals scraped from X/Twitter, tagged by significance and verification status.
- **Map stories** — curated narratives that group events into a geographic sequence you can play back on the map.
- **Daily briefs** — generated situation reports that summarize the last 24 hours of activity including escalation scoring, casualties, and scenarios.

The dashboard ties these together so you can move between the map, the event timeline, actor dossiers, and the daily brief without losing context.

## Project structure

```
src/
  app/            Next.js app router — pages, API routes, layouts
  features/       Feature modules (actors, events, map, news, signals, etc.)
  shared/         Shared components, hooks, state, and query utilities
  server/         Server-only code — DB client, API helpers, scoring logic
  types/          Domain types used across features
prisma/
  schema.prisma   Database schema
  migrations/     Tracked Prisma migrations
  seed.ts         Deterministic fallback seed
scripts/
  db/             Snapshot bootstrap, publish, restore, and verify tooling
.github/
  workflows/      CI, deploy, and snapshot publishing workflows
```

Features are self-contained under `src/features/{name}/` with their own `components/`, `queries/`, and `hooks/` subdirectories. Shared UI primitives live in `src/components/ui/` (shadcn). Design tokens are defined as CSS variables in `src/app/globals.css`.

## Database and snapshots

Pharos publishes a sanitized database snapshot every 12 hours as a public GitHub Release asset. When you run `npm run setup`, the bootstrap script downloads the latest snapshot and restores it into your local Docker Postgres. If the download fails (offline, first release not yet published, etc.) it falls back to the deterministic seed in `prisma/seed.ts`.

The snapshot contains only allowlisted application tables — no chat sessions, no user data, no Supabase system schemas. The full policy is documented in [`docs/database/SNAPSHOT_POLICY.md`](docs/database/SNAPSHOT_POLICY.md).

Useful commands:

| Command | What it does |
|---------|-------------|
| `npm run setup` | Start Postgres + bootstrap from snapshot |
| `npm run db:bootstrap` | Pull, verify, and restore latest snapshot |
| `npm run db:seed` | Restore deterministic fallback dataset |
| `npm run db:studio` | Open Prisma Studio for local DB browsing |
| `npm run db:migrate` | Create a new migration from schema changes |

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full setup walkthrough, branch workflow, and PR guidelines.

Code conventions are documented in [`CODEX.md`](CODEX.md). The key rules: 150-line file limit, `type` not `interface`, CSS variables for all colours, shadcn primitives for interactive elements, and enforced import ordering.

## Contributors

<a href="https://github.com/Juliusolsson05/pharos-ai/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Juliusolsson05/pharos-ai" />
</a>
