function missing(name: string): never {
  throw new Error(`Missing required environment variable: ${name}`);
}

export function getRequiredEnv(name: string): string {
  return process.env[name] ?? missing(name);
}

export const publicConflictId = getRequiredEnv('NEXT_PUBLIC_CONFLICT_ID');
export const databaseUrl = getRequiredEnv('DATABASE_URL');
