import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, STALE } from '@/shared/lib/query/keys';

// ── Engine types ─────────────────────────────────────────────────

export type EventCluster = {
  id: string;
  canonicalTitle: string;
  severity: 'CRITICAL' | 'HIGH' | 'STANDARD';
  eventType: string;
  location: string | null;
  firstSeen: string;
  lastUpdated: string;
  sourceCount: number;
  perspectives: string[];
  feedItemLinks: string[];
  confidenceScore: number;
  threatDelta: number;
  keywords: string[];
  summary: string | null;
};

export type ThreatAssessment = {
  timestamp: string;
  overallLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MONITORING';
  escalationScore: number;
  activeClusterCount: number;
  topClusters: EventCluster[];
  perspectiveBias: Record<string, number>;
  recommendation: string;
};

export type AnomalyResult = {
  detectedAt: string;
  clusterId: string;
  isAnomaly: boolean;
  anomalyScore: number;
  anomalyType: string;
  description: string;
};

export type CircuitInfo = {
  feedId: string;
  state: 'Closed' | 'Open' | 'HalfOpen';
};

export type Hotspot = {
  centroidLon: number;
  centroidLat: number;
  eventCount: number;
  intensity: number;
  avgSeverity: number;
  perspectives: string[];
  eventTypes: string[];
  timeSpanHours: number;
  topEventTitles: string[];
};

export type Corridor = {
  locationA: string;
  locationB: string;
  distance: number;
  eventPairs: number;
  avgGapHours: number;
  eventTypes: string[];
};

export type TheaterOverview = {
  totalEvents: number;
  last24Hours: number;
  boundingBox: { minLon: number; minLat: number; maxLon: number; maxLat: number };
  severityBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  activePerspectives: string[];
  centroid: { lon: number; lat: number };
};

export type CredibilityScore = {
  feedId: string;
  overallScore: number;
  tierScore: number;
  stateFunded: boolean;
  confirmationRate: number;
  totalReports: number;
  confirmedReports: number;
  tier: number;
};

export type EscalationForecast = {
  timestamp: string;
  currentLevel: number;
  trend: 'Accelerating' | 'Escalating' | 'Stable' | 'Cooling' | 'DeEscalating';
  rateOfChange: number;
  acceleration: number;
  volatility: number;
  forecast1h: { projected: number; confidenceInterval: number };
  forecast6h: { projected: number; confidenceInterval: number };
  forecast24h: { projected: number; confidenceInterval: number };
  activePatterns: { name: string; description: string; escalationBias: number; confidence: number }[];
  confidence: number;
  dataPoints: number;
};

export type EscalationPoint = {
  timestamp: string;
  intensity: number;
  dominantType: string;
  maxSeverity: string;
  clusterCount: number;
};

// ── Core engine hooks ────────────────────────────────────────────

export function useEngineClusters() {
  return useQuery({
    queryKey: queryKeys.engine.clusters(),
    queryFn: () => api.get<{ clusters: EventCluster[]; count: number }>('/engine/clusters'),
    staleTime: STALE.SHORT,
  });
}

export function useEngineThreat() {
  return useQuery({
    queryKey: queryKeys.engine.threat(),
    queryFn: () => api.get<ThreatAssessment>('/engine/threat'),
    staleTime: STALE.SHORT,
  });
}

export function useEngineAnomalies() {
  return useQuery({
    queryKey: queryKeys.engine.anomalies(),
    queryFn: () => api.get<{ anomalies: AnomalyResult[]; count: number }>('/engine/anomalies'),
    staleTime: STALE.SHORT,
  });
}

export function useEngineCircuits() {
  return useQuery({
    queryKey: queryKeys.engine.circuits(),
    queryFn: () => api.get<{ circuits: CircuitInfo[] }>('/engine/circuits'),
    staleTime: STALE.MEDIUM,
  });
}

// ── Geospatial hooks ─────────────────────────────────────────────

export function useGeoHotspots() {
  return useQuery({
    queryKey: queryKeys.engine.geoHotspots(),
    queryFn: () => api.get<{ hotspots: Hotspot[]; count: number }>('/engine/geo/hotspots'),
    staleTime: STALE.SHORT,
  });
}

export function useGeoCorridors() {
  return useQuery({
    queryKey: queryKeys.engine.geoCorridors(),
    queryFn: () => api.get<{ corridors: Corridor[]; count: number }>('/engine/geo/corridors'),
    staleTime: STALE.MEDIUM,
  });
}

export function useGeoTheater() {
  return useQuery({
    queryKey: queryKeys.engine.geoTheater(),
    queryFn: () => api.get<TheaterOverview>('/engine/geo/theater'),
    staleTime: STALE.SHORT,
  });
}

export function useGeoNear(lon: number, lat: number, radius = 50) {
  return useQuery({
    queryKey: queryKeys.engine.geoNear(lon, lat, radius),
    queryFn: () => api.get<{ events: Array<Record<string, unknown>>; count: number }>(
      buildUrl('/engine/geo/near', { lon, lat, radius }),
    ),
    staleTime: STALE.SHORT,
    enabled: lon !== 0 && lat !== 0,
  });
}

// ── Source credibility hooks ─────────────────────────────────────

export function useSourceCredibility() {
  return useQuery({
    queryKey: queryKeys.engine.credibility(),
    queryFn: () => api.get<{ scores: CredibilityScore[]; count: number }>('/engine/credibility'),
    staleTime: STALE.MEDIUM,
  });
}

// ── Escalation prediction hooks ──────────────────────────────────

export function useEscalationForecast() {
  return useQuery({
    queryKey: queryKeys.engine.escalationForecast(),
    queryFn: () => api.get<EscalationForecast>('/engine/escalation/forecast'),
    staleTime: STALE.SHORT,
  });
}

export function useEscalationSeries() {
  return useQuery({
    queryKey: queryKeys.engine.escalationSeries(),
    queryFn: () => api.get<{ points: EscalationPoint[]; count: number }>('/engine/escalation/series'),
    staleTime: STALE.SHORT,
  });
}

// ── Narrative synthesis hooks ────────────────────────────────────

export type SitrepSection = { title: string; lines: string[] };
export type SitrepEvent = {
  clusterId: string; severity: string; eventType: string; title: string;
  location: string | null; firstSeen: string; sourceCount: number;
  perspectives: string[]; confidence: number; summary: string | null;
};
export type Sitrep = {
  id: string; generatedAt: string; threatLevel: string; headline: string;
  situation: SitrepSection; keyEvents: SitrepEvent[];
  geoPicture: SitrepSection; escalation: SitrepSection;
  sourceAnalysis: SitrepSection; outlook: SitrepSection;
  recommendations: string[]; rawMetrics: Record<string, number>;
};
export type SitrepSummary = {
  id: string; generatedAt: string; threatLevel: string;
  clusterCount: number; headline: string;
};

export function useSitrepHistory() {
  return useQuery({
    queryKey: queryKeys.engine.sitrepHistory(),
    queryFn: () => api.get<{ reports: SitrepSummary[]; count: number }>('/engine/sitrep/history'),
    staleTime: STALE.MEDIUM,
  });
}

// ── Contradiction hooks ──────────────────────────────────────────

export type ContradictionResult = {
  clusterIdA: string; clusterIdB: string;
  perspectiveA: string; perspectiveB: string;
  description: string; severity: number;
};

export function useContradictions() {
  return useQuery({
    queryKey: queryKeys.engine.contradictions(),
    queryFn: () => api.get<{ contradictions: ContradictionResult[]; count: number }>('/engine/contradictions'),
    staleTime: STALE.SHORT,
  });
}

// ── Event chain hooks ────────────────────────────────────────────

export type EventChainResult = {
  id: string; causeId: string; causeTitle: string; causeType: string;
  effectId: string; effectTitle: string; effectType: string;
  linkType: string; confidence: number; temporalGap: number;
  description: string;
};
export type EventGraphResult = {
  nodes: { id: string; title: string; eventType: string; severity: string; timestamp: string }[];
  edges: { sourceId: string; targetId: string; linkType: string; confidence: number }[];
  rootCauses: string[]; terminalEffects: string[];
  longestChainLen: number; totalChains: number;
};

export function useEventChains() {
  return useQuery({
    queryKey: queryKeys.engine.chains(),
    queryFn: () => api.get<{ chains: EventChainResult[]; count: number }>('/engine/chains'),
    staleTime: STALE.MEDIUM,
  });
}

export function useEventGraph() {
  return useQuery({
    queryKey: queryKeys.engine.chainsGraph(),
    queryFn: () => api.get<EventGraphResult>('/engine/chains/graph'),
    staleTime: STALE.MEDIUM,
  });
}

// ── Alert hooks ──────────────────────────────────────────────────

export type Alert = {
  id: string;
  ruleId: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  details: string;
  timestamp: string;
  acknowledged: boolean;
};

export function useActiveAlerts() {
  return useQuery({
    queryKey: queryKeys.engine.alerts(),
    queryFn: () => api.get<{ alerts: Alert[]; count: number }>('/engine/alerts'),
    staleTime: STALE.SHORT,
  });
}

export function useAlertHistory() {
  return useQuery({
    queryKey: queryKeys.engine.alertHistory(),
    queryFn: () => api.get<{ alerts: Alert[]; count: number; total: number }>('/engine/alerts/history'),
    staleTime: STALE.SHORT,
  });
}

// ── Temporal analysis types ──────────────────────────────────────

export type TemporalProfile = {
  totalEvents: number;
  timeSpanHours: number;
  eventsPerHour: number;
  last24hCount: number;
  last1hCount: number;
  peakHourUtc: number;
  maxBurstSize: number;
  avgBurstSize: number;
  typeDistribution: Record<string, number>;
  severityTrend: number;
};

export type TemporalPattern = {
  name: string;
  description: string;
  confidence: number;
  severity: string;
};

export type HourlyActivity = {
  hour: number;
  count: number;
  avgSeverity: number;
  topType: string | null;
};

// ── Temporal analysis hooks ─────────────────────────────────────

export function useTemporalProfile() {
  return useQuery({
    queryKey: queryKeys.engine.temporalProfile(),
    queryFn: () => api.get<TemporalProfile>('/engine/temporal/profile'),
    staleTime: STALE.SHORT,
  });
}

export function useTemporalPatterns() {
  return useQuery({
    queryKey: queryKeys.engine.temporalPatterns(),
    queryFn: () => api.get<{ patterns: TemporalPattern[]; count: number }>('/engine/temporal/patterns'),
    staleTime: STALE.SHORT,
  });
}

export function useTemporalHourly() {
  return useQuery({
    queryKey: queryKeys.engine.temporalHourly(),
    queryFn: () => api.get<{ hours: HourlyActivity[] }>('/engine/temporal/hourly'),
    staleTime: STALE.SHORT,
  });
}

// ── Composite threat types ───────────────────────────────────────

export type ThreatFactor = {
  name: string;
  score: number;
  weight: number;
  description: string;
};

export type CompositeThreat = {
  timestamp: string;
  compositeScore: number;
  threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MONITORING';
  confidence: number;
  confidenceLow: number;
  confidenceHigh: number;
  factors: ThreatFactor[];
  dominantFactor: string;
  clusterCount: number;
  dataPoints: number;
  recommendation: string;
};

// ── Composite threat hooks ──────────────────────────────────────

export function useCompositeThreat() {
  return useQuery({
    queryKey: queryKeys.engine.compositeThreat(),
    queryFn: () => api.get<CompositeThreat>('/engine/threat/composite'),
    staleTime: STALE.SHORT,
  });
}

// ── Source network types ─────────────────────────────────────────

export type SourceNode = {
  feedId: string;
  perspectives: string[];
  totalReports: number;
  uniqueClusters: number;
  activeHours: number;
  avgResponseTime: number;
};

export type SourceEdge = {
  sourceA: string;
  sourceB: string;
  weight: number;
  coReportCount: number;
  relationship: string;
};

export type SourceNetwork = {
  nodes: SourceNode[];
  edges: SourceEdge[];
  totalSources: number;
  totalClusters: number;
  avgSourcesPerCluster: number;
};

export type EchoChamber = {
  perspective: string;
  feedIds: string[];
  avgSimilarity: number;
  sharedClusters: number;
  totalClusters: number;
  riskLevel: string;
  description: string;
};

export type CoverageGap = {
  perspective: string;
  coverageRatio: number;
  description: string;
};

export type CoverageReport = {
  totalClusters: number;
  singleSourceClusters: number;
  singlePerspectiveClusters: number;
  multiPerspectiveClusters: number;
  independenceScore: number;
  perspectiveCoverage: Record<string, number>;
  coverageGaps: CoverageGap[];
  singleSourceRatio: number;
};

export type SourcePair = {
  feedIdA: string;
  feedIdB: string;
  coReportCount: number;
  totalA: number;
  totalB: number;
  jaccardSimilarity: number;
};

// ── Source network hooks ────────────────────────────────────────

export function useNetworkGraph() {
  return useQuery({
    queryKey: queryKeys.engine.networkGraph(),
    queryFn: () => api.get<SourceNetwork>('/engine/network/graph'),
    staleTime: STALE.MEDIUM,
  });
}

export function useEchoChambers() {
  return useQuery({
    queryKey: queryKeys.engine.networkEchoChambers(),
    queryFn: () => api.get<{ echoChambers: EchoChamber[]; count: number }>('/engine/network/echo-chambers'),
    staleTime: STALE.MEDIUM,
  });
}

export function useNetworkCoverage() {
  return useQuery({
    queryKey: queryKeys.engine.networkCoverage(),
    queryFn: () => api.get<CoverageReport>('/engine/network/coverage'),
    staleTime: STALE.MEDIUM,
  });
}

export function useCoReportingPairs() {
  return useQuery({
    queryKey: queryKeys.engine.networkPairs(),
    queryFn: () => api.get<{ pairs: SourcePair[]; count: number }>('/engine/network/pairs'),
    staleTime: STALE.MEDIUM,
  });
}

// ── Phase history types ──────────────────────────────────────────

export type PhaseTransition = {
  fromRung: number;
  toRung: number;
  score: number;
  trigger: string;
  timestamp: string;
  direction: 'ESCALATED' | 'DE-ESCALATED';
};

export function usePhaseHistory() {
  return useQuery({
    queryKey: queryKeys.engine.phaseHistory(),
    queryFn: () => api.get<{ phases: PhaseTransition[]; count: number }>('/engine/phases'),
    staleTime: STALE.SHORT,
  });
}

// ── Strategic game model types ───────────────────────────────────

export type StrategicAction = {
  name: string;
  actionType: 'Escalatory' | 'DeEscalatory' | 'Neutral';
  escalationDelta: number;
  description: string;
};

export type Consequence = {
  name: string;
  description: string;
  category: 'Security' | 'Economic' | 'Humanitarian' | 'Diplomatic';
  severity: string;
};

export type ScenarioOutcome = {
  newCompositeScore: number;
  newRung: number;
  escalationDelta: number;
  probability: number;
  consequences: Consequence[];
  strategicImpact: string;
};

export type CounterMove = {
  actor: string;
  action: StrategicAction;
  outcome: ScenarioOutcome;
};

export type GameScenario = {
  id: string;
  initiator: string;
  action: StrategicAction;
  outcome: ScenarioOutcome;
  counterMoves: CounterMove[];
  netEscalation: number;
  timeHorizon: string;
  historicalNote: string | null;
};

export type LadderRung = {
  level: number;
  name: string;
  description: string;
  thresholdLow: number;
  thresholdHigh: number;
};

export type AnnotatedRung = {
  rung: LadderRung;
  isCurrent: boolean;
  momentum: string | null;
};

export type EscalationLadder = {
  currentRung: number;
  currentScore: number;
  momentum: string;
  rungs: AnnotatedRung[];
  nextThreshold: number | null;
  prevThreshold: number | null;
};

export type KeyIndicator = {
  name: string;
  value: string;
  trend: 'CRITICAL' | 'WARNING' | 'NORMAL' | 'POSITIVE';
  threshold: string;
};

export type StrategicWindow = {
  name: string;
  timeframe: string;
  action: string;
  urgency: string;
  expiresIf: string;
};

export type ActorState = {
  actor: string;
  posture: string;
  recentActions: string[];
  capabilities: string[];
  constraints: string[];
  threatTo: string[];
};

export type ConflictStateResult = {
  timestamp: string;
  compositeScore: number;
  threatLevel: string;
  clusterCount: number;
  militaryEvents: number;
  diplomaticEvents: number;
  criticalEvents: number;
  escalationTrend: string;
  rateOfChange: number;
  activePatterns: string[];
};

export type StrategicAssessment = {
  timestamp: string;
  currentRung: number;
  rungName: string;
  compositeScore: number;
  momentum: string;
  keyIndicators: KeyIndicator[];
  strategicWindows: StrategicWindow[];
  actorStates: ActorState[];
  topScenarios: GameScenario[];
  overallAssessment: string;
};

// ── Strategic game model hooks ─────────────────────────────────

export function useConflictState() {
  return useQuery({
    queryKey: queryKeys.engine.strategyState(),
    queryFn: () => api.get<ConflictStateResult>('/engine/strategy/state'),
    staleTime: STALE.SHORT,
  });
}

export function useStrategicScenarios() {
  return useQuery({
    queryKey: queryKeys.engine.strategyScenarios(),
    queryFn: () => api.get<{ scenarios: GameScenario[]; count: number }>('/engine/strategy/scenarios'),
    staleTime: STALE.SHORT,
  });
}

export function useEscalationLadder() {
  return useQuery({
    queryKey: queryKeys.engine.strategyLadder(),
    queryFn: () => api.get<EscalationLadder>('/engine/strategy/ladder'),
    staleTime: STALE.SHORT,
  });
}

export function useStrategicAssessment() {
  return useQuery({
    queryKey: queryKeys.engine.strategyAssessment(),
    queryFn: () => api.get<StrategicAssessment>('/engine/strategy/assessment'),
    staleTime: STALE.SHORT,
  });
}

// ── SSE stream hooks ─────────────────────────────────────────────

export type StreamEvent = {
  id: string; timestamp: string; type: string;
  severity: string; title: string; payload: Record<string, unknown>;
};

export function useStreamRecent() {
  return useQuery({
    queryKey: queryKeys.engine.streamRecent(),
    queryFn: () => api.get<{ events: StreamEvent[]; count: number }>('/engine/stream/recent'),
    staleTime: STALE.SHORT,
  });
}

/** Hook for SSE event stream connection. Uses native EventSource.
  * Returns connection status and a buffer of recent events received via SSE. */
export function useEngineStream(onEvent?: (event: StreamEvent) => void) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const es = new EventSource('/api/v1/engine/stream');

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as StreamEvent;
        setEvents(prev => [data, ...prev].slice(0, 100));
        onEventRef.current?.(data);
      } catch { /* ignore parse errors */ }
    };

    const types = ['NewCluster', 'ClusterUpdate', 'Anomaly', 'ThreatChange',
      'Escalation', 'Flash', 'Contradiction', 'ChainLink'];
    types.forEach(t => es.addEventListener(t, handler));

    return () => {
      types.forEach(t => es.removeEventListener(t, handler));
      es.close();
    };
  }, []);

  return { connected, events };
}
