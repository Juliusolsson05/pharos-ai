import type {
  AisFeature,
  ApiEnvelope,
  EonetFeature,
  FirmsFeature,
  GdeltFeature,
  NightlightsManifest,
  OpenskyFeature,
  OverpassFeature,
  PortFeature,
  ReferenceFeature,
  UsgsFeature,
} from '@/features/map/types';

const OSINT_BASE_URL = 'http://localhost:4000';

export type TimedResult<T> = { data: T; ms: number; path: string };

async function readJson<T>(path: string): Promise<TimedResult<T>> {
  const start = performance.now();
  const response = await fetch(`${OSINT_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }

  const payload = await response.json() as ApiEnvelope<T>;
  const ms = Math.round(performance.now() - start);
  return { data: payload.data, ms, path };
}

export function loadNightlightsManifest() {
  return readJson<NightlightsManifest>('/api/nightlights/latest/manifest');
}

export function loadReferenceFeatures() {
  return readJson<{ items: ReferenceFeature[] }>('/api/providers/reference/features?kind=all&limit=300');
}

type BatchResponse = Record<string, { items: unknown[]; total: number }>;

const BATCH_QUERY = 'gdelt:200,firms:500,usgs:200,opensky:500,eonet:400,overpass:500,ports:500,aisstream:500';

export function loadBatch() {
  return readJson<BatchResponse>(`/api/batch?providers=${BATCH_QUERY}`);
}

export type BatchData = {
  gdelt: GdeltFeature[];
  firms: FirmsFeature[];
  usgs: UsgsFeature[];
  opensky: OpenskyFeature[];
  eonet: EonetFeature[];
  overpass: OverpassFeature[];
  ports: PortFeature[];
  ais: AisFeature[];
};

export function extractBatch(raw: BatchResponse): BatchData {
  return {
    gdelt: (raw.gdelt?.items ?? []) as GdeltFeature[],
    firms: (raw.firms?.items ?? []) as FirmsFeature[],
    usgs: (raw.usgs?.items ?? []) as UsgsFeature[],
    opensky: (raw.opensky?.items ?? []) as OpenskyFeature[],
    eonet: (raw.eonet?.items ?? []) as EonetFeature[],
    overpass: (raw.overpass?.items ?? []) as OverpassFeature[],
    ports: (raw.ports?.items ?? []) as PortFeature[],
    ais: (raw.aisstream?.items ?? []) as AisFeature[],
  };
}

export { OSINT_BASE_URL };
