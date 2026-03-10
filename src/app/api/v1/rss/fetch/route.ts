import { NextRequest } from 'next/server';

import Parser from 'rss-parser';

import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import type { FeedResult } from '@/types/domain';

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

const FRESH_TTL = 10 * 60 * 1000;
const STALE_TTL = 60 * 60 * 1000;
const ERROR_TTL = 2 * 60 * 1000;
const refetchingSet = new Set<string>();

type CacheEntry = { data: FeedResult; ts: number };
const cache = new Map<string, CacheEntry>();

function normalizeDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString();
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  const retry = new Date(cleaned);
  if (!isNaN(retry.getTime())) return retry.toISOString();
  return undefined;
}

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

async function fetchFeed(id: string, url: string): Promise<FeedResult> {
  try {
    const feed = await parser.parseURL(url);
    return {
      feedId: id,
      feedTitle: feed.title ?? id,
      items: (feed.items ?? []).slice(0, 25).map(item => {
        const iso = normalizeDate(item.isoDate) ?? normalizeDate(item.pubDate);
        return {
          title: item.title ?? '(untitled)',
          link: item.link ?? '',
          pubDate: item.pubDate ?? item.isoDate ?? '',
          contentSnippet: (item.contentSnippet ?? '').slice(0, 300),
          creator: item.creator ?? (item as never as Record<string, unknown>)['dc:creator'] as string ?? undefined,
          categories: item.categories ?? [],
          isoDate: iso,
          imageUrl: extractImage(item as never),
        };
      }),
      cachedAt: Date.now(),
      fresh: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { feedId: id, feedTitle: id, items: [], error: msg };
  }
}

function backgroundRefetch(id: string, url: string) {
  const key = `${id}:${url}`;
  if (refetchingSet.has(key)) return;
  refetchingSet.add(key);
  fetchFeed(id, url)
    .then(result => {
      if (!result.error) {
        cache.set(url, { data: result, ts: Date.now() });
      } else {
        const existing = cache.get(url);
        if (existing) cache.set(url, { data: existing.data, ts: Date.now() - FRESH_TTL });
      }
    })
    .finally(() => refetchingSet.delete(key));
}

async function getFeedCached(id: string, url: string): Promise<FeedResult> {
  const cached = cache.get(url);
  const now = Date.now();

  if (cached) {
    const age = now - cached.ts;
    if (age < FRESH_TTL) return { ...cached.data, fresh: true, cachedAt: cached.ts };
    if (age < STALE_TTL) {
      backgroundRefetch(id, url);
      return { ...cached.data, fresh: false, cachedAt: cached.ts };
    }
  }

  const result = await fetchFeed(id, url);
  if (!result.error) {
    cache.set(url, { data: result, ts: now });
  } else if (cached) {
    cache.set(url, { data: cached.data, ts: now - FRESH_TTL });
    return { ...cached.data, fresh: false, cachedAt: now - FRESH_TTL };
  } else {
    cache.set(url, { data: result, ts: now - STALE_TTL + ERROR_TTL });
  }
  return result;
}

// POST /api/v1/rss/fetch — bulk prefetch
export async function POST(req: NextRequest) {
  const allFeeds = await prisma.rssFeed.findMany();
  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.ids ?? allFeeds.map(f => f.id);

  const results = await Promise.allSettled(
    ids.map(id => {
      const feed = allFeeds.find(f => f.id === id);
      if (!feed) return Promise.resolve({ feedId: id, feedTitle: id, items: [], error: 'unknown feed' } as FeedResult);
      return getFeedCached(feed.id, feed.url);
    })
  );

  const feeds = results.map(r => r.status === 'fulfilled' ? r.value : { feedId: '?', items: [], error: 'fetch failed' });

  return ok(
    { feeds, cachedFeeds: cache.size, totalFeeds: allFeeds.length },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}

// GET /api/v1/rss/fetch?ids=id1,id2
export async function GET(req: NextRequest) {
  const feedIds = req.nextUrl.searchParams.get('ids');
  if (!feedIds) {
    return err('BAD_REQUEST', 'Provide ?ids=id1,id2');
  }

  const allFeeds = await prisma.rssFeed.findMany();
  const ids = feedIds.split(',').map(s => s.trim());

  const urlsToFetch: { id: string; url: string }[] = [];
  for (const id of ids) {
    const feed = allFeeds.find(f => f.id === id);
    if (feed) urlsToFetch.push({ id: feed.id, url: feed.url });
  }

  const results: FeedResult[] = await Promise.all(
    urlsToFetch.map(({ id, url }) => getFeedCached(id, url)),
  );

  return ok(
    { feeds: results },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
