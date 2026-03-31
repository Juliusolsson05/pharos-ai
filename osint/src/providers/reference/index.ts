import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data', 'reference');

export function loadInstallations(): Record<string, unknown>[] {
  const dir = join(DATA_DIR, 'installations');
  const all: Record<string, unknown>[] = [];

  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const raw = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    if (Array.isArray(raw)) all.push(...raw);
  }

  return all;
}

export function loadVessels(): Record<string, unknown>[] {
  const dir = join(DATA_DIR, 'vessels');
  const all: Record<string, unknown>[] = [];

  try {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const raw = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
      if (Array.isArray(raw)) all.push(...raw);
    }
  } catch {
    // vessels dir may not exist yet
  }

  return all;
}
