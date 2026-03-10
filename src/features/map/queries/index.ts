import { useQuery } from '@tanstack/react-query';

import type { DataArrays } from '@/features/map/lib/map-filter-engine';

import { publicConflictId } from '@/shared/lib/env';
import { api } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

import type { Asset, HeatPoint,MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { ActorMeta } from '@/data/map-tokens';
import type { MapStory } from '@/types/domain';

const CONFLICT_ID = publicConflictId;

export type MapDataResponse = {
  strikes: StrikeArc[];
  missiles: MissileTrack[];
  targets: Target[];
  assets: Asset[];
  threatZones: ThreatZone[];
  heatPoints: HeatPoint[];
  actorMeta: Record<string, ActorMeta>;
};

export type MapDataResult = DataArrays & { actorMeta: Record<string, ActorMeta> };

function toDataArrays(r: MapDataResponse): MapDataResult {
  return {
    strikes:    r.strikes  ?? [],
    missiles:   r.missiles ?? [],
    targets:    r.targets  ?? [],
    assets:     r.assets   ?? [],
    zones:      r.threatZones ?? [],
    heat:       r.heatPoints  ?? [],
    actorMeta:  r.actorMeta ?? {},
  };
}

export function useMapData(id: string = CONFLICT_ID) {
  return useQuery({
    queryKey: queryKeys.map.data(id),
    queryFn: () => api.get<MapDataResponse>(`/conflicts/${id}/map/data`),
    staleTime: STALE.MEDIUM,
    refetchInterval: REFETCH.NORMAL,
    select: toDataArrays,
  });
}

export function useMapStories(id: string = CONFLICT_ID) {
  return useQuery({
    queryKey: queryKeys.map.stories(id),
    queryFn: () => api.get<MapStory[]>(`/conflicts/${id}/map/stories`),
    staleTime: STALE.MEDIUM,
    refetchInterval: REFETCH.NORMAL,
  });
}
