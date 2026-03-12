# Agent Mirrors

These files are the checked-in OpenClaw workspace mirrors for `iran-2026`.

## Single source of truth

Canonical doctrine lives in `src/server/lib/pharos-doctrine.ts` and is served via `/api/v1/admin/[conflictId]/instructions`.

The files in this folder are the authoritative mirrors that get deployed to the VPS workspace. They must stay in sync with the canonical doctrine. Do not hand-edit VPS workspace files independently — update these mirrors and redeploy.

## Deployment mapping

| Repo file | VPS workspace file | Notes |
|-----------|-------------------|-------|
| `agent/AGENTS.md` | `AGENTS.md` | Core runtime rules |
| `agent/HEARTBEAT.md` | `HEARTBEAT.md` | 30-min wake cycle |
| `agent/TOOLS.md` | `TOOLS.md` | Append auth block on VPS only |
| `agent/SOUL.md` | `SOUL.md` | Operational character |
| `agent/IDENTITY.md` | `IDENTITY.md` | Pre-filled identity |
| `agent/USER.md` | `USER.md` | Operator may personalize on VPS |
| `agent/BOOTSTRAP_MESSAGE.md` | `BOOTSTRAP.md` | Note the filename change |

## What differs on VPS

- `TOOLS.md` has the real `PHAROS_ADMIN_API_KEY` appended (never in repo).
- `USER.md` may have the operator's real name (repo keeps it generic).
- `BOOTSTRAP_MESSAGE.md` is renamed to `BOOTSTRAP.md` on deploy.
