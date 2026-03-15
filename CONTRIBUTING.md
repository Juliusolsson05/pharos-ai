# Contributing to Pharos

Thanks for your interest in contributing. This document covers the setup process, workflow, and code standards.

## Prerequisites

- **Node.js 22+**
- **Docker** (for local PostgreSQL)
- **npm** (ships with Node.js)

## Local development setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/Juliusolsson05/pharos-ai.git
   cd pharos-ai
   ```

2. **Copy the environment template**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the required values. At minimum you need `DATABASE_URL` pointing to your local Postgres (the next step provides defaults).

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Run the setup script**

   ```bash
   npm run setup
   ```

   This command starts local PostgreSQL, applies all tracked migrations, tries to restore the latest public onboarding snapshot, and falls back to the deterministic seed if the snapshot is unavailable.

   If you already have an older Postgres 16 Docker volume from a previous setup, run `docker compose down -v` once before rerunning `npm run setup`.

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Branch workflow

| Branch | Purpose |
|--------|---------|
| `main` | Production -- deploys to [conflicts.app](https://conflicts.app) |
| `staging` | Pre-production -- migrations tested here first |
| Feature branches | Your work -- branch from `staging` |

1. Create a feature branch from `staging`
2. Open a PR against `staging`
3. CI runs automatically (build, lint, type-check, migration check)
4. After review and merge to `staging`, migrations are applied to the staging database
5. Once verified, `staging` is merged to `main`

## Code standards

All code conventions are documented in [`CODEX.md`](CODEX.md). Key points:

- **150-line file limit** -- split if larger
- **`type` not `interface`** for props
- **CSS variables** (`var(--token)`) for colours, never hex literals
- **shadcn `<Button>`** for all interactive elements, never raw `<button>` or `role="button"`
- **Import order** is enforced by ESLint (`eslint-plugin-simple-import-sort`)

Run the linter before submitting:

```bash
npm run lint
```

## Database changes

If your change requires a schema modification:

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate` to generate a migration
3. Commit the migration file alongside your code changes
4. CI will verify the migration applies cleanly to a fresh database

Never use `prisma db push` for changes that need to be tracked. Always create a proper migration.

## Snapshot-backed onboarding

Public onboarding snapshots are documented in [`docs/database/SNAPSHOTS.md`](docs/database/SNAPSHOTS.md).

- `npm run db:bootstrap` restores the latest public snapshot into local Docker Postgres
- `npm run db:seed` remains the offline-safe fallback path
- Snapshot contents are controlled by the allowlist in [`docs/database/SNAPSHOT_POLICY.md`](docs/database/SNAPSHOT_POLICY.md)

## Reporting issues

Use [GitHub Issues](https://github.com/Juliusolsson05/pharos-ai/issues). Include:

- Steps to reproduce
- Expected vs actual behaviour
- Browser/OS if relevant
- Screenshots if applicable

## Pull request guidelines

- Keep PRs focused -- one feature or fix per PR
- Write a clear description of what changed and why
- Ensure CI passes before requesting review
- Reference related issues with `Fixes #123` or `Closes #123`
