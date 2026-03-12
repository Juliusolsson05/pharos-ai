<p align="center">
  <img src="public/logo.svg" alt="Pharos" width="320" />
</p>

<p align="center">
  Open-source intelligence dashboard tracking the Iran conflict in real time.
  <br />
  <a href="https://conflicts.app"><strong>conflicts.app</strong></a>
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

Next.js 16 · React 19 · TypeScript · DeckGL · MapLibre · Prisma 7 · PostgreSQL · Tailwind CSS · Vercel

## Open-source scope

Pharos is being open-sourced in stages. This repository currently includes the application layer — the dashboard, interface, and supporting app code.

The internal agent layer that ingests and prepares data for the application is not yet included. The goal is to open-source the agent layer around March 12th.

## License

[AGPL-3.0-only](LICENSE)

---

<a href="https://conflicts.app">
  <img src="public/og-image-1200x630.jpg" alt="conflicts.app — live geopolitical intelligence dashboard" width="100%" />
</a>
