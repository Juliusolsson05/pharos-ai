import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import type { RssFeed, ConflictCollection } from '@/types/domain';

import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys } from '@/shared/lib/query/keys';

const CONFLICT_ID = publicConflictId;

export function useRssFeeds() {
  return useQuery({
    queryKey: queryKeys.rss.feeds(),
    queryFn: () => api.get<RssFeed[]>('/rss/feeds'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useRssCollections(conflictId?: string) {
  const id = conflictId ?? CONFLICT_ID;
  return useQuery({
    queryKey: queryKeys.rss.collections(id),
    queryFn: () =>
      api.get<ConflictCollection[]>(buildUrl('/rss/collections', { conflictId: id })),
    staleTime: 60 * 60 * 1000,
  });
}
