import { publicConflictId } from '@/shared/lib/env';

const CONFLICT_ID = publicConflictId;

export const queryKeys = {
  bootstrap: {
    all: () => ['bootstrap'] as const,
  },
  conflicts: {
    detail: (id = CONFLICT_ID) => ['conflict', id] as const,
    days: (id = CONFLICT_ID) => ['conflict-days', id] as const,
    snapshot: (id = CONFLICT_ID, day?: string) =>
      ['conflict-day-snapshot', id, day] as const,
  },
  actors: {
    list: (id = CONFLICT_ID, day?: string) => ['actors', id, day] as const,
    detail: (id = CONFLICT_ID, actorId?: string, day?: string) =>
      ['actor', id, actorId, day] as const,
  },
  events: {
    list: (id = CONFLICT_ID, filters?: object) =>
      ['events', id, filters] as const,
    detail: (id = CONFLICT_ID, eventId?: string) =>
      ['event', id, eventId] as const,
  },
  xPosts: {
    list: (id = CONFLICT_ID, filters?: object) =>
      ['x-posts', id, filters] as const,
    byEvent: (id = CONFLICT_ID, eventId?: string) =>
      ['x-posts-by-event', id, eventId] as const,
    byActor: (id = CONFLICT_ID, actorId?: string) =>
      ['x-posts-by-actor', id, actorId] as const,
  },
  map: {
    data: (id = CONFLICT_ID) => ['map-data', id] as const,
    stories: (id = CONFLICT_ID) => ['map-stories', id] as const,
  },
  rss: {
    feeds: () => ['rss-feeds'] as const,
    collections: (id = CONFLICT_ID) => ['rss-collections', id] as const,
  },
  economics: {
    indexes: (filters?: object) =>
      ['economic-indexes', filters] as const,
  },
  predictions: {
    groups: () => ['prediction-groups'] as const,
  },
  worldBank: {
    military: (countries?: string[]) =>
      ['world-bank-military', countries] as const,
  },
};
