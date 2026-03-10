import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import { api } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

import type { Conflict, ConflictDaySnapshot } from '@/types/domain';

const CONFLICT_ID = publicConflictId;

export function useConflict(id: string = CONFLICT_ID) {
  return useQuery({
    queryKey: queryKeys.conflicts.detail(id),
    queryFn: () => api.get<Conflict>(`/conflicts/${id}`),
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}

export function useConflictDays(id: string = CONFLICT_ID) {
  return useQuery({
    queryKey: queryKeys.conflicts.days(id),
    queryFn: () => api.get<ConflictDaySnapshot[]>(`/conflicts/${id}/days`),
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}

export function useConflictDaySnapshot(id: string = CONFLICT_ID, day?: string) {
  return useQuery({
    queryKey: queryKeys.conflicts.snapshot(id, day),
    queryFn: () => api.get<ConflictDaySnapshot>(`/conflicts/${id}/days/${day}`),
    enabled: !!day,
    staleTime: STALE.SHORT,
    refetchInterval: REFETCH.FAST,
  });
}
