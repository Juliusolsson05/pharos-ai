import type { FeedItem, FeedResult } from '@/types/domain';

export function toFeedItemsMap(
  feeds: FeedResult[],
  previous?: Map<string, FeedItem[]>,
) {
  const map = new Map(previous ?? []);

  for (const feed of feeds) {
    if (feed.error && map.has(feed.feedId)) continue;
    map.set(feed.feedId, feed.items ?? []);
  }

  return map;
}
