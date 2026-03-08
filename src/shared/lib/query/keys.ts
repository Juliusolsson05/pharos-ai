import { publicConflictId } from '@/shared/lib/env';

/** Shared staleTime constants for React Query */
export const STALE = {
  /** 1 minute — fast-moving data (events, x-posts) */
  SHORT: 60_000,
  /** 5 minutes — moderate data (bootstrap, map) */
  MEDIUM: 5 * 60_000,
  /** 1 hour — slow-moving data (RSS, economics, predictions) */
  LONG: 60 * 60_000,
  /** 24 hours — near-static data (World Bank indicators) */
  DAY: 24 * 60 * 60_000,
} as const;

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
    fetchItems: (ids: string[]) => ['rss-fetch', ...ids.sort()] as const,
  },
  economics: {
    indexes: (filters?: object) =>
      ['economic-indexes', filters] as const,
    markets: (tickers: string, range: string, interval: string) =>
      ['markets', tickers, range, interval] as const,
  },
  predictions: {
    groups: () => ['prediction-groups'] as const,
    markets: () => ['prediction-markets'] as const,
    history: (tokenId: string, range: string) => ['prediction-history', tokenId, range] as const,
    chart: (tokenId: string) => ['prediction-chart', tokenId] as const,
  },
  worldBank: {
    military: (countries?: string[]) =>
      ['world-bank-military', countries] as const,
  },
  engine: {
    clusters: () => ['engine-clusters'] as const,
    threat: () => ['engine-threat'] as const,
    anomalies: () => ['engine-anomalies'] as const,
    metrics: () => ['engine-metrics'] as const,
    circuits: () => ['engine-circuits'] as const,
    geoHotspots: () => ['engine-geo-hotspots'] as const,
    geoCorridors: () => ['engine-geo-corridors'] as const,
    geoTheater: () => ['engine-geo-theater'] as const,
    geoNear: (lon: number, lat: number, radius?: number) =>
      ['engine-geo-near', lon, lat, radius] as const,
    credibility: () => ['engine-credibility'] as const,
    escalationForecast: () => ['engine-escalation-forecast'] as const,
    escalationSeries: () => ['engine-escalation-series'] as const,
    sitrepHistory: () => ['engine-sitrep-history'] as const,
    contradictions: () => ['engine-contradictions'] as const,
    chains: () => ['engine-chains'] as const,
    chainsGraph: () => ['engine-chains-graph'] as const,
    streamRecent: () => ['engine-stream-recent'] as const,
    alerts: () => ['engine-alerts'] as const,
    alertHistory: () => ['engine-alerts-history'] as const,
    temporalProfile: () => ['engine-temporal-profile'] as const,
    temporalPatterns: () => ['engine-temporal-patterns'] as const,
    temporalHourly: () => ['engine-temporal-hourly'] as const,
    networkGraph: () => ['engine-network-graph'] as const,
    networkEchoChambers: () => ['engine-network-echo-chambers'] as const,
    networkCoverage: () => ['engine-network-coverage'] as const,
    networkPairs: () => ['engine-network-pairs'] as const,
    compositeThreat: () => ['engine-threat-composite'] as const,
    phaseHistory: () => ['engine-phase-history'] as const,
    strategyState: () => ['engine-strategy-state'] as const,
    strategyScenarios: () => ['engine-strategy-scenarios'] as const,
    strategyLadder: () => ['engine-strategy-ladder'] as const,
    strategyAssessment: () => ['engine-strategy-assessment'] as const,
  },
};
