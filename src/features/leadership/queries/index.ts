import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import { api } from '@/shared/lib/query/client';
import { queryKeys, STALE } from '@/shared/lib/query/keys';

import type { LeadershipTreeResponse } from '@/types/domain';

const CONFLICT_ID = publicConflictId;

export function useActorLeadership(id: string = CONFLICT_ID, actorId?: string) {
  return useQuery({
    queryKey: queryKeys.actors.leadership(id, actorId),
    queryFn: () => api.get<LeadershipTreeResponse>(`/conflicts/${id}/actors/${actorId}/leadership`),
    enabled: !!actorId,
    staleTime: STALE.MEDIUM,
  });
}
