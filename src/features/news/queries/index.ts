import { useQuery, useQueryClient } from '@tanstack/react-query';

import { toFeedItemsMap } from '@/features/news/lib/feed-items-map';

import { publicConflictId } from '@/shared/lib/env';
import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

import type { ConflictCollection, FeedItem, FeedResult,RssFeed } from '@/types/domain';

const CONFLICT_ID = publicConflictId;

export function useRssFeeds() {
  return useQuery({
    queryKey: queryKeys.rss.feeds(),
    queryFn: () => api.get<RssFeed[]>('/rss/feeds'),
    staleTime: STALE.LONG,
    refetchInterval: REFETCH.SLOW,
  });
}

export function useRssCollections(conflictId?: string) {
  const id = conflictId ?? CONFLICT_ID;
  return useQuery({
    queryKey: queryKeys.rss.collections(id),
    queryFn: () =>
      api.get<ConflictCollection[]>(buildUrl('/rss/collections', { conflictId: id })),
    staleTime: STALE.LONG,
    refetchInterval: REFETCH.SLOW,
  });
}

export async function fetchFeedItems(ids: string[]): Promise<FeedResult[]> {
  if (ids.length === 0) return [];
  const res = await fetch('/api/v1/rss/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const data = await res.json();
  return data?.feeds ?? [];
}

export async function fetchSingleFeed(id: string): Promise<FeedResult | null> {
  const res = await fetch(`/api/v1/rss/fetch?ids=${id}`);
  const data = await res.json();
  return data?.feeds?.[0] ?? null;
}

/** Fetches RSS feed items and returns them as a Map keyed by feedId. */
export function useRssFeedItems(ids: string[]) {
  const queryClient = useQueryClient();
  const sorted = [...ids].sort();
  return useQuery({
    queryKey: queryKeys.rss.fetchItems(sorted),
    queryFn: async () => {
      const previous = queryClient.getQueryData<Map<string, FeedItem[]>>(
        queryKeys.rss.fetchItems(sorted),
      );
      const feeds = await fetchFeedItems(sorted);

      return toFeedItemsMap(feeds, previous);
    },
    staleTime: STALE.MEDIUM,
    refetchInterval: REFETCH.NORMAL,
    enabled: ids.length > 0,
  });
}
