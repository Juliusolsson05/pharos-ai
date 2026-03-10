import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

import type { Actor } from '@/types/domain';

const CONFLICT_ID = publicConflictId;

export function useActors(id: string = CONFLICT_ID, day?: string) {
  return useQuery({
    queryKey: queryKeys.actors.list(id, day),
    queryFn: () =>
      api.get<Actor[]>(buildUrl(`/conflicts/${id}/actors`, { day, lite: true })),
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}

export function useActor(id: string = CONFLICT_ID, actorId?: string, day?: string) {
  return useQuery({
    queryKey: queryKeys.actors.detail(id, actorId, day),
    queryFn: () =>
      api.get<Actor>(buildUrl(`/conflicts/${id}/actors/${actorId}`, { day })),
    enabled: !!actorId,
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}
