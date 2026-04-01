import { prisma } from '../../db.js';

type JsonObject = Record<string, unknown>;

export type ProviderApiConfig = {
  source: string;
  rawModel?: string;
  rawOrderField?: string;
  featureModel?: string;
  featureOrderField?: string;
};

export function parsePageParams(query: Record<string, unknown>) {
  const rawLimit = Number.parseInt(String(query.limit ?? '100'), 10);
  const rawOffset = Number.parseInt(String(query.offset ?? '0'), 10);

  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 100;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;
  const featureType = typeof query.featureType === 'string' ? query.featureType : undefined;

  return { limit, offset, featureType };
}

export function serializeFeature(feature: {
  id: string;
  featureType: string;
  sourceEventId: string | null;
  actor: string | null;
  priority: string;
  category: string;
  type: string;
  status: string | null;
  timestamp: Date | null;
  geometry: unknown;
  properties: unknown;
  source: string;
  createdAt: Date;
}) {
  return {
    id: feature.id,
    featureType: feature.featureType,
    sourceEventId: feature.sourceEventId,
    actor: feature.actor,
    priority: feature.priority,
    category: feature.category,
    type: feature.type,
    status: feature.status,
    timestamp: feature.timestamp?.toISOString() ?? null,
    geometry: feature.geometry,
    properties: feature.properties,
    source: feature.source,
    createdAt: feature.createdAt.toISOString(),
  };
}

function getDelegate(model: string) {
  return (prisma as any)[model] as {
    findMany: (args: JsonObject) => Promise<unknown[]>;
    count: (args?: JsonObject) => Promise<number>;
  };
}

export async function getRawRows(config: ProviderApiConfig, limit: number, offset: number) {
  if (!config.rawModel) {
    return null;
  }

  const orderField = config.rawOrderField || 'ingestedAt';
  return getDelegate(config.rawModel).findMany({
    orderBy: { [orderField]: 'desc' },
    take: limit,
    skip: offset,
  });
}

export async function getFeatureRows(config: ProviderApiConfig, limit: number, offset: number) {
  const model = config.featureModel || config.rawModel;
  if (!model) {
    return null;
  }

  const orderField = config.featureOrderField || config.rawOrderField || 'ingestedAt';
  return getDelegate(model).findMany({
    orderBy: { [orderField]: 'desc' },
    take: limit,
    skip: offset,
  });
}

export async function getRawCount(config: ProviderApiConfig) {
  if (!config.rawModel) {
    return null;
  }

  return getDelegate(config.rawModel).count();
}

export async function getFeatureCount(config: ProviderApiConfig) {
  const model = config.featureModel || config.rawModel;
  if (!model) {
    return null;
  }

  return getDelegate(model).count();
}
