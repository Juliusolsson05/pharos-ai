import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import type { IntelEvent, EventFilters } from '@/types/domain';

import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys } from '@/shared/lib/query/keys';

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
    staleTime: 60_000,
  });
}

export function useEvent(id: string = CONFLICT_ID, eventId?: string) {
  return useQuery({
    queryKey: queryKeys.events.detail(id, eventId),
    queryFn: () => api.get<IntelEvent>(`/conflicts/${id}/events/${eventId}`),
    enabled: !!eventId,
    staleTime: 60_000,
  });
}
