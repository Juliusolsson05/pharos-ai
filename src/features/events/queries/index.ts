import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

import type { EventFilters,IntelEvent } from '@/types/domain';

const CONFLICT_ID = publicConflictId;

export function useEvents(id: string = CONFLICT_ID, filters?: EventFilters) {
  return useQuery({
    queryKey: queryKeys.events.list(id, filters),
    queryFn: () =>
      api.get<IntelEvent[]>(
        buildUrl(`/conflicts/${id}/events`, {
          day: filters?.day,
          severity: filters?.severity,
          type: filters?.type,
          verified: filters?.verified,
          lite: true,
        }),
      ),
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}

export function useEvent(id: string = CONFLICT_ID, eventId?: string) {
  return useQuery({
    queryKey: queryKeys.events.detail(id, eventId),
    queryFn: () => api.get<IntelEvent>(`/conflicts/${id}/events/${eventId}`),
    enabled: !!eventId,
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}
