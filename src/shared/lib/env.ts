function missing(name: string): never {
  throw new Error(`Missing required environment variable: ${name}`);
}

/**
 * Read a required env var at runtime (server-only).
 * For NEXT_PUBLIC_* vars, use the dedicated exports below instead —
 * Next.js only inlines public env vars when accessed with a literal
 * string (process.env.NEXT_PUBLIC_X), not via dynamic lookup.
 */
export function getRequiredEnv(name: string): string {
  return process.env[name] ?? missing(name);
}

/* ── public (client-safe) env vars ─────────────────────────────── */

// Accessed via literal so Next.js can inline at build time.
export const publicConflictId: string =
  process.env.NEXT_PUBLIC_CONFLICT_ID ?? 'iran-2026';

export const publicAppUrl: string =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.conflicts.app';

export const publicPosthogKey: string | undefined =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

export const publicPosthogHost: string =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export const publicAnalyticsEnabled: boolean =
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

/* ── server-only env vars ──────────────────────────────────────── */

// Lazy getter — only evaluated when called on the server.
export function getDatabaseUrl(): string {
  return getRequiredEnv('DATABASE_URL');
}
