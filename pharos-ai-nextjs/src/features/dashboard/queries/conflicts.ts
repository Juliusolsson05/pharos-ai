import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import type { Conflict, ConflictDaySnapshot } from '@/types/domain';

import { api } from '@/shared/lib/query/client';
import { queryKeys } from '@/shared/lib/query/keys';

const CONFLICT_ID = publicConflictId;

export function useConflict(id: string = CONFLICT_ID) {
  return useQuery({
    queryKey: queryKeys.conflicts.detail(id),
    queryFn: () => api.get<Conflict>(`/conflicts/${id}`),
    staleTime: 60_000,
  });
}

export function useConflictDays(id: string = CONFLICT_ID) {
  return useQuery({
    queryKey: queryKeys.conflicts.days(id),
    queryFn: () => api.get<ConflictDaySnapshot[]>(`/conflicts/${id}/days`),
    staleTime: 60_000,
  });
}

export function useConflictDaySnapshot(id: string = CONFLICT_ID, day?: string) {
  return useQuery({
    queryKey: queryKeys.conflicts.snapshot(id, day),
    queryFn: () => api.get<ConflictDaySnapshot>(`/conflicts/${id}/days/${day}`),
    enabled: !!day,
    staleTime: 60_000,
  });
}
