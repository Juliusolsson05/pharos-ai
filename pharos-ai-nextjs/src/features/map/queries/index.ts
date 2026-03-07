import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import type { MapStory } from '@/types/domain';
import type { StrikeArc, MissileTrack, Target, Asset, ThreatZone, HeatPoint } from '@/data/map-data';
import type { DataArrays } from '@/features/map/lib/map-filter-engine';
import type { ActorMeta } from '@/data/map-tokens';

import { api } from '@/shared/lib/query/client';
import { queryKeys } from '@/shared/lib/query/keys';

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
    staleTime: 5 * 60 * 1000,
    select: toDataArrays,
  });
}

export function useMapStories(id: string = CONFLICT_ID) {
  return useQuery({
    queryKey: queryKeys.map.stories(id),
    queryFn: () => api.get<MapStory[]>(`/conflicts/${id}/map/stories`),
    staleTime: 5 * 60 * 1000,
  });
}
