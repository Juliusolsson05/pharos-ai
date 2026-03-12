import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

import type { XPost, XPostFilters } from '@/types/domain';

const CONFLICT_ID = publicConflictId;

export function useXPosts(id: string = CONFLICT_ID, filters?: XPostFilters) {
  return useQuery({
    queryKey: queryKeys.xPosts.list(id, filters),
    queryFn: () =>
      api.get<XPost[]>(
        buildUrl(`/conflicts/${id}/x-posts`, {
          day: filters?.day,
          significance: filters?.significance,
          accountType: filters?.accountType,
          pharosOnly: filters?.pharosOnly,
        }),
      ),
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}

export function useXPostsByEvent(id: string = CONFLICT_ID, eventId?: string) {
  return useQuery({
    queryKey: queryKeys.xPosts.byEvent(id, eventId),
    queryFn: () =>
      api.get<XPost[]>(`/conflicts/${id}/x-posts/by-event/${eventId}`),
    enabled: !!eventId,
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}

export function useXPostsByActor(id: string = CONFLICT_ID, actorId?: string) {
  return useQuery({
    queryKey: queryKeys.xPosts.byActor(id, actorId),
    queryFn: () =>
      api.get<XPost[]>(`/conflicts/${id}/x-posts/by-actor/${actorId}`),
    enabled: !!actorId,
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}
