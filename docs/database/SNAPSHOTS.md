# Database Snapshots

Pharos publishes a public onboarding snapshot every 12 hours so new contributors can start with near-current app data instead of stale hardcoded seed content.

## How local setup works

`npm run setup` now does the following:

1. Starts local Docker Postgres
2. Generates Prisma Client
3. Applies tracked Prisma migrations
4. Downloads the latest public snapshot release assets
5. Verifies the snapshot checksum and metadata
6. Restores the snapshot into local Postgres
7. Falls back to `prisma/seed.ts` if any snapshot step fails

This keeps local onboarding easy while preserving an offline-safe fallback path.

## Production snapshot role setup

The publish workflow expects `PUBLIC_SNAPSHOT_DATABASE_URL` to point at a dedicated read-only database role named `snapshot_reader`.

When you first set up snapshots on Supabase or when you add new allowlisted snapshot tables:

1. Connect with a privileged role such as `postgres` using the direct or migration connection
2. Run `scripts/db/sql/grant-snapshot-reader.sql`
3. Run `scripts/db/sql/verify-snapshot-reader.sql`
4. Confirm the verification query returns zero rows

The grant script covers the full snapshot allowlist, not just recent patches, and it also sets default table privileges for future public tables created by `postgres` in the `public` schema.

If the publish workflow fails with `permission denied for table ...`, that almost always means the allowlist changed in `scripts/db/manifest.ts` without refreshing `snapshot_reader` grants.

## Snapshot format

- Release tag: `db-snapshot-latest`
- Dump file: `pharos-db-snapshot.dump`
- Metadata file: `pharos-db-snapshot.json`
- Local download path: `temp/db-snapshots/`

The published artifact is data-only. Schema creation stays in Prisma migrations, which makes the snapshot portable across local environments.

The snapshot now includes leadership tree product data as well, including people, roles, relations, tenures, control states, and leadership event links. That keeps fresh local restores aligned with the live actor dossier and leadership graph experience.

## Commands

```bash
npm run db:bootstrap
npm run db:snapshot:pull
npm run db:snapshot:verify
npm run db:snapshot:restore
```

Use `npm run db:seed` only when you explicitly want the deterministic fallback dataset.
