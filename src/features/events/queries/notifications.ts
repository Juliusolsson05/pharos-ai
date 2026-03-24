import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys } from '@/shared/lib/query/keys';

import type { EventNotificationCandidate } from '@/types/domain';

const CONFLICT_ID = publicConflictId;

export function useEventNotifications(
  id: string = CONFLICT_ID,
  cursor?: { createdAt?: string; id?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.events.notifications(id, cursor?.createdAt, cursor?.id),
    queryFn: () => api.get<EventNotificationCandidate[]>(
      buildUrl(`/conflicts/${id}/events/notifications`, {
        afterId: cursor?.id,
        createdAfter: cursor?.createdAt,
        limit: 25,
      }),
    ),
    enabled,
    staleTime: 0,
    refetchInterval: enabled ? 60_000 : false,
    refetchIntervalInBackground: enabled,
  });
}
