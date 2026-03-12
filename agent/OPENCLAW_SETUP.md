# OpenClaw Setup for Pharos

How to configure an OpenClaw instance to run the Pharos fulfillment agent.

This is a reproducible recipe, not a log of one specific deployment.

---

## 1. Docker environment

OpenClaw Docker images may gate plugin loading on environment variables.
If a required env var is missing, the image may skip the plugin and the gateway can crash-loop.

Required in the Docker `.env` file:

```
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENCLAW_GATEWAY_TOKEN=<generated-token>
```

Optional (enable as needed):

```
TELEGRAM_BOT_TOKEN=<bot-token-from-botfather>
BRAVE_API_KEY=<brave-search-api-key>
```

The gateway token is used for Control UI auth, hooks, and remote access.

## 2. openclaw.json structure

All config lives in `~/.openclaw/openclaw.json` inside the container
(mapped from `data/.openclaw/openclaw.json` on the host).

### Agent defaults

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      skipBootstrap: true,
      userTimezone: "Europe/Stockholm",
      timeFormat: "24",
      heartbeat: {
        every: "30m",
        target: "telegram",
        to: "<telegram-user-id>",
        lightContext: false
      }
    }
  }
}
```

- `skipBootstrap: true` prevents OpenClaw from recreating default workspace templates over our files.
- `lightContext: false` keeps the full workspace context (AGENTS.md, SOUL.md, TOOLS.md, etc.) during heartbeat runs. More tokens but the agent needs its runtime rules.
- Omit `activeHours` for 24/7 operation.

### Hooks

```json5
{
  hooks: {
    internal: {
      enabled: true,
      entries: {
        "session-memory": { enabled: true },
        "boot-md": { enabled: true }
      }
    }
  }
}
```

- `session-memory` saves context when `/new` or `/reset` is issued.
- `boot-md` runs `BOOT.md` on gateway startup.

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "<bot-token>",
      dmPolicy: "allowlist",
      allowFrom: ["<telegram-user-id>"],
      groups: { "*": { requireMention: true } },
      streaming: "partial"
    }
  }
}
```

Create the bot via @BotFather, then pair:
1. DM the bot — you get a pairing code.
2. Approve: `openclaw pairing approve telegram <CODE>`
3. Switch `dmPolicy` to `allowlist` with your numeric user ID after pairing.

### Web search (Brave)

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        timeoutSeconds: 30
      }
    }
  }
}
```

Requires `BRAVE_API_KEY` in Docker env. Free tier covers ~1,000 queries/month.

### Browser (headless)

```json5
{
  browser: {
    enabled: true,
    headless: true,
    noSandbox: true,
    defaultProfile: "openclaw"
  }
}
```

Most OpenClaw Docker images bundle Chromium and Playwright. The browser starts on demand when the agent uses the `browser` tool.

## 3. Workspace file mapping

Copy the `agent/` repo files to `/data/.openclaw/workspace/` on the host:

| Repo file | Workspace file | Notes |
|-----------|---------------|-------|
| `agent/AGENTS.md` | `AGENTS.md` | Core runtime rules |
| `agent/HEARTBEAT.md` | `HEARTBEAT.md` | 30-min wake checklist |
| `agent/TOOLS.md` | `TOOLS.md` | Needs auth block added (see below) |
| `agent/SOUL.md` | `SOUL.md` | Operational character |
| `agent/IDENTITY.md` | `IDENTITY.md` | Pre-filled identity |
| `agent/USER.md` | `USER.md` | Operator profile |
| `agent/BOOTSTRAP_MESSAGE.md` | `BOOTSTRAP.md` | Note the filename change |
| — | `MEMORY.md` | Leave empty; agent populates |
| — | `BOOT.md` | Leave as default or empty |

### TOOLS.md auth block (deployment only)

After copying `TOOLS.md`, append the Pharos API credentials directly on the deployment target.
These are **never** checked into the repo.

```markdown
## Authentication
- app base URL: https://www.conflicts.app
- admin base URL: https://www.conflicts.app/api/v1/admin
- conflict: <conflict-id>
- header: Authorization: Bearer <PHAROS_ADMIN_API_KEY>
- PHAROS_ADMIN_API_KEY: <key>
- this key is safe to use for Pharos admin operations
```

### USER.md personalization (deployment only)

The repo `USER.md` uses a generic operator name. On the deployment target, replace the name and profile with the real operator's details. Do not commit personal names back to the repo.

### Sync contract

The repo `agent/` files are the canonical mirrors. Do not hand-edit VPS workspace files independently. To update the agent's behavior:

1. Update the repo mirrors in `agent/`.
2. Redeploy to VPS workspace.
3. Append the auth block to `TOOLS.md` on VPS only.
4. Restart: `docker compose down && docker compose up -d`.

## 4. Restart procedure

Always use `docker compose down && docker compose up -d` (not `restart`).

`restart` keeps the container filesystem including `/tmp`, which can cause stale
`/tmp/jiti/` cache permission errors that prevent plugins from loading.

## 5. Accessing the Control UI

The Control UI requires a secure context (HTTPS or localhost).

For remote access, use an SSH tunnel:

```bash
ssh -N -L <local-port>:127.0.0.1:<gateway-port> -i <ssh-key> <user>@<vps-ip>
```

Then open `http://localhost:<local-port>/` and enter the gateway token.

## 6. Verification checklist

After deployment, confirm:

- [ ] `openclaw channels status` — Telegram shows `running` (if configured)
- [ ] `openclaw browser status` — shows `detectedBrowser: chromium`
- [ ] `openclaw status` — heartbeat shows `30m (main)`
- [ ] `openclaw hooks list` — hooks are loaded (boot-md, session-memory, etc.)
- [ ] DM the Telegram bot — agent responds (if Telegram configured)
- [ ] Agent can call `web_search` and `web_fetch`
