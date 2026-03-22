import path from 'node:path';

import type { ParsedArgs } from './types';

export function parseArgs(argv: string[]): ParsedArgs {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg?.startsWith('--')) continue;

    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }

    values.set(key, value);
    index += 1;
  }

  const eventId = values.get('event-id');
  if (!eventId) {
    throw new Error('Missing required --event-id');
  }

  return {
    baseUrl: values.get('base-url') ?? process.env.X_IMAGE_BASE_URL ?? 'https://www.conflicts.app',
    conflictId: values.get('conflict-id') ?? process.env.NEXT_PUBLIC_CONFLICT_ID ?? 'iran-2026',
    eventId,
    outDir: values.get('out-dir') ?? path.join(process.cwd(), 'temp', 'x-image-fulfillment'),
  };
}
