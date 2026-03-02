import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
    ],
  },
});

// ─── Aggressive cache with stale-while-revalidate ─────────────
// Each feed is cached for 10 minutes (fresh). After that it's stale
// but still served immediately while a background refetch happens.
// Max stale age: 30 minutes (after that, force-refetch).

const FRESH_TTL = 10 * 60 * 1000;    // 10 min — serve without any fetch
const STALE_TTL = 30 * 60 * 1000;    // 30 min — serve stale + background refetch
const refetchingSet = new Set<string>(); // track in-flight background refetches

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  creator?: string;
  categories?: string[];
  isoDate?: string;
  imageUrl?: string;
}

interface FeedResult {
  feedId: string;
  feedTitle: string;
  items: FeedItem[];
  error?: string;
  cachedAt?: number;
  fresh?: boolean;
}

interface CacheEntry {
  data: FeedResult;
  ts: number;
}

const cache = new Map<string, CacheEntry>();

/** Extract image URL from various RSS feed formats */
function extractImage(item: Record<string, unknown>): string | undefined {
  const mc = item.mediaContent as Record<string, unknown> | undefined;
  if (mc) {
    const url = (mc.$ as Record<string, string>)?.url ?? mc.url;
    if (typeof url === 'string' && url.startsWith('http')) return url;
  }
  const mt = item.mediaThumbnail as Record<string, unknown> | undefined;
  if (mt) {
    const url = (mt.$ as Record<string, string>)?.url ?? mt.url;
    if (typeof url === 'string' && url.startsWith('http')) return url;
  }
  const enc = item.enclosure as Record<string, unknown> | undefined;
  if (enc) {
    const url = (enc.$ as Record<string, string>)?.url ?? enc.url;
    const type = (enc.$ as Record<string, string>)?.type ?? enc.type ?? '';
    if (typeof url === 'string' && url.startsWith('http') && String(type).startsWith('image')) return url;
  }
  const content = item['content:encoded'] as string ?? item.content as string ?? '';
  if (content) {
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (match?.[1]?.startsWith('http')) return match[1];
  }
  return undefined;
}

/** Fetch a single feed and return parsed result */
async function fetchFeed(id: string, url: string): Promise<FeedResult> {
  try {
    const feed = await parser.parseURL(url);
    return {
      feedId: id,
      feedTitle: feed.title ?? id,
      items: (feed.items ?? []).slice(0, 25).map(item => ({
        title: item.title ?? '(untitled)',
        link: item.link ?? '',
        pubDate: item.pubDate ?? item.isoDate ?? '',
        contentSnippet: (item.contentSnippet ?? '').slice(0, 300),
        creator: item.creator ?? item['dc:creator'] ?? undefined,
        categories: item.categories ?? [],
        isoDate: item.isoDate ?? undefined,
        imageUrl: extractImage(item as unknown as Record<string, unknown>),
      })),
      cachedAt: Date.now(),
      fresh: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { feedId: id, feedTitle: id, items: [], error: msg };
  }
}

/** Background refetch — updates cache without blocking response */
function backgroundRefetch(id: string, url: string) {
  const key = `${id}:${url}`;
  if (refetchingSet.has(key)) return; // already in-flight
  refetchingSet.add(key);
  fetchFeed(id, url)
    .then(result => {
      if (!result.error) {
        cache.set(url, { data: result, ts: Date.now() });
      }
    })
    .finally(() => refetchingSet.delete(key));
}

/** Get feed with stale-while-revalidate strategy */
async function getFeedCached(id: string, url: string): Promise<FeedResult> {
  const cached = cache.get(url);
  const now = Date.now();

  if (cached) {
    const age = now - cached.ts;

    // Fresh — serve as-is
    if (age < FRESH_TTL) {
      return { ...cached.data, fresh: true, cachedAt: cached.ts };
    }

    // Stale but within window — serve stale, trigger background refetch
    if (age < STALE_TTL) {
      backgroundRefetch(id, url);
      return { ...cached.data, fresh: false, cachedAt: cached.ts };
    }
  }

  // No cache or too old — blocking fetch
  const result = await fetchFeed(id, url);
  if (!result.error) {
    cache.set(url, { data: result, ts: now });
  }
  return result;
}

// ─── Bulk prefetch endpoint ───────────────────────────────────
// POST /api/rss with { ids: string[] } to prefetch all feeds at once
// Returns immediately with cache status for each feed.

export async function POST(req: NextRequest) {
  const { RSS_FEEDS } = await import('@/data/rssFeeds');
  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.ids ?? RSS_FEEDS.map((f: { id: string }) => f.id);

  // Fire off all fetches in parallel
  const results = await Promise.allSettled(
    ids.map(id => {
      const feed = RSS_FEEDS.find((f: { id: string }) => f.id === id);
      if (!feed) return Promise.resolve({ feedId: id, items: [], error: 'unknown feed' } as FeedResult);
      return getFeedCached(feed.id, feed.url);
    })
  );

  const feeds = results.map(r => r.status === 'fulfilled' ? r.value : { feedId: '?', items: [], error: 'fetch failed' });

  return NextResponse.json(
    { feeds, cachedFeeds: cache.size, totalFeeds: RSS_FEEDS.length },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}

// ─── Single/multi feed GET endpoint ───────────────────────────

export async function GET(req: NextRequest) {
  const feedIds = req.nextUrl.searchParams.get('ids');

  if (!feedIds) {
    return NextResponse.json({ error: 'Provide ?ids=id1,id2' }, { status: 400 });
  }

  const { RSS_FEEDS } = await import('@/data/rssFeeds');
  const ids = feedIds.split(',').map(s => s.trim());

  const urlsToFetch: { id: string; url: string }[] = [];
  for (const id of ids) {
    const feed = RSS_FEEDS.find((f: { id: string }) => f.id === id);
    if (feed) urlsToFetch.push({ id: feed.id, url: feed.url });
  }

  const results: FeedResult[] = await Promise.all(
    urlsToFetch.map(({ id, url }) => getFeedCached(id, url)),
  );

  return NextResponse.json(
    { feeds: results },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
