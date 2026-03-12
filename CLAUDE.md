# Pharos AI — Agent Instructions

## Style Authority

All coding decisions follow **CODEX.md** at the project root. Read it before writing any code.

## Key File Paths

| Purpose | Path |
|---------|------|
| Domain types | `src/types/domain.ts` |
| CSS design tokens | `src/app/globals.css` (`:root` block) |
| API client + `buildUrl` | `src/shared/lib/query/client.ts` |
| Query key factory + STALE constants | `src/shared/lib/query/keys.ts` |
| Server response helpers (`ok`/`err`) | `src/server/lib/api-utils.ts` |
| Static constants (NOT in DB) | `src/data/` |
| Feature modules | `src/features/{feature}/` |

## Post-Feature Review (mandatory)

After completing any feature, bug fix, or significant change:

1. Read **docs/CODE_REVIEW.md**.
2. Run every check in the checklist against each file you created or modified.
3. Fix any violations before considering the task done.

Do not skip this step. The review exists to prevent style drift that accumulates across AI-assisted sessions.
