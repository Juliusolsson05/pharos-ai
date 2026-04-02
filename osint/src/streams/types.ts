/**
 * Generic interface for persistent data streams.
 * Each stream is a long-lived connection (WebSocket, SSE, etc.)
 * that runs alongside the Express server and BullMQ workers.
 */
export type StreamHandle = {
  name: string;
  enabled: () => boolean;
  start: () => void;
  stop: () => void;
  status: () => Record<string, unknown>;
};
