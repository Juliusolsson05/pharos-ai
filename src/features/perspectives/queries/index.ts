import { useQuery } from '@tanstack/react-query';

import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys } from '@/shared/lib/query/keys';

type PerspectiveLiveStatus = {
  handle: string;
  isLive: boolean;
  playableInEmbed: boolean;
  videoId: string | null;
  ttl: number;
};

const PERSPECTIVES_STALE = 10 * 60_000;

export function usePerspectiveLiveStatus(handle: string) {
  return useQuery({
    queryKey: queryKeys.perspectives.liveStatus(handle),
    queryFn: () => api.get<PerspectiveLiveStatus>(buildUrl('/perspectives/live-status', { handle })),
    staleTime: PERSPECTIVES_STALE,
    gcTime: PERSPECTIVES_STALE,
    refetchInterval: PERSPECTIVES_STALE,
  });
}

export type { PerspectiveLiveStatus };
