import type { StreamHandle } from './types.js';
import { stream as aisStream } from './aisstream/stream.js';

// Register all persistent streams here.
// To add a new stream: create streams/{name}/stream.ts, export a StreamHandle, add it below.
const ALL_STREAMS: StreamHandle[] = [
  aisStream,
];

export function startStreams() {
  for (const s of ALL_STREAMS) {
    if (!s.enabled()) {
      console.log(`[stream] ${s.name} skipped (not configured)`);
      continue;
    }
    s.start();
    console.log(`[stream] ${s.name} started`);
  }
}

export function stopStreams() {
  for (const s of ALL_STREAMS) {
    s.stop();
  }
}

export function getStreamStatuses(): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const s of ALL_STREAMS) {
    result[s.name] = s.enabled() ? s.status() : { enabled: false };
  }
  return result;
}
