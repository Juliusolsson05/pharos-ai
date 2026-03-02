'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CONFLICT_COLLECTIONS, RSS_FEEDS, type ConflictCollection } from '@/data/rssFeeds';
import { ConflictBanner } from '@/components/news/ConflictBanner';
import { ChannelView } from '@/components/news/ChannelView';
import { AllFeedsView } from '@/components/news/AllFeedsView';

type ViewMode = 'conflict' | 'all';

// ─── Client-side cache (persists across re-renders) ───────────
interface CachedFeed {
  feedId: string;
  items: FeedItem[];
  fetchedAt: number;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  creator?: string;
  isoDate?: string;
  categories?: string[];
  imageUrl?: string;
}

const clientCache = new Map<string, CachedFeed>();
const CLIENT_FRESH_TTL = 5 * 60 * 1000; // 5 min client-side

export default function NewsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('conflict');
  const [activeChannel, setActiveChannel] = useState(0);
  const [showImages, setShowImages] = useState(false);
  const [feedData, setFeedData] = useState<Map<string, FeedItem[]>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const collection = CONFLICT_COLLECTIONS[0];
  const channel = collection.channels[activeChannel];

  // Batch fetch all feeds (or just the ones needed)
  const fetchFeeds = useCallback(async (ids?: string[]) => {
    setRefreshing(true);
    try {
      const feedIds = ids ?? RSS_FEEDS.map(f => f.id);

      // Check client cache — only fetch stale ones
      const staleIds = feedIds.filter(id => {
        const cached = clientCache.get(id);
        return !cached || Date.now() - cached.fetchedAt > CLIENT_FRESH_TTL;
      });

      // If all are fresh in client cache, just use cache
      if (staleIds.length === 0) {
        const map = new Map<string, FeedItem[]>();
        feedIds.forEach(id => {
          const cached = clientCache.get(id);
          if (cached) map.set(id, cached.items);
        });
        setFeedData(map);
        setRefreshing(false);
        return;
      }

      // Batch fetch stale ones from server (server has its own cache too)
      const res = await fetch('/api/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: staleIds }),
      });
      const data = await res.json();

      // Update client cache
      const now = Date.now();
      for (const feed of data.feeds ?? []) {
        if (feed.items?.length > 0) {
          clientCache.set(feed.feedId, {
            feedId: feed.feedId,
            items: feed.items,
            fetchedAt: now,
          });
        }
      }

      // Build combined map (all requested ids)
      const map = new Map<string, FeedItem[]>();
      feedIds.forEach(id => {
        const cached = clientCache.get(id);
        if (cached) map.set(id, cached.items);
      });
      setFeedData(map);
      setLastRefresh(now);
    } catch (err) {
      console.error('Feed batch fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initial load — prefetch all feeds in one batch
  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchFeeds(), 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchFeeds]);

  const timeSinceRefresh = lastRefresh
    ? `${Math.floor((Date.now() - lastRefresh) / 1000)}s ago`
    : 'loading...';

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--bd)] bg-[var(--bg-app)] shrink-0">
        <div className="flex items-center gap-3">
          <span className="mono text-[10px] font-bold text-[var(--t3)] tracking-wider">
            RSS MONITOR
          </span>
          <div className="w-px h-4 bg-[var(--bd)]" />
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('conflict')}
              className={`px-3 py-1 rounded text-[9px] mono font-bold tracking-wider transition-colors ${
                viewMode === 'conflict'
                  ? 'bg-[var(--danger-dim)] text-[var(--danger)] border border-[var(--danger-bd)]'
                  : 'text-[var(--t4)] hover:text-[var(--t2)]'
              }`}
            >
              CONFLICTS
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded text-[9px] mono font-bold tracking-wider transition-colors ${
                viewMode === 'all'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-[var(--t4)] hover:text-[var(--t2)]'
              }`}
            >
              ALL FEEDS
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Image toggle */}
          <button
            onClick={() => setShowImages(v => !v)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded text-[9px] mono tracking-wider transition-colors ${
              showImages
                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1" y="2" width="10" height="8" rx="1" />
              <circle cx="4" cy="5" r="1" />
              <path d="M1 9 L4 6 L6 8 L8 5 L11 9" />
            </svg>
            {showImages ? 'ON' : 'OFF'}
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => fetchFeeds()}
            disabled={refreshing}
            className="flex items-center gap-2 px-2 py-1 rounded text-[9px] mono text-[var(--t4)] hover:text-[var(--t2)] transition-colors disabled:opacity-40"
          >
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={refreshing ? 'animate-spin' : ''}
            >
              <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" />
              <path d="M1 1v4h4M11 11v-4h-4" />
            </svg>
            REFRESH
          </button>

          <div className="flex items-center gap-2">
            <div className={`dot ${refreshing ? 'dot-warn' : 'dot-live'}`} />
            <span className="mono text-[9px] text-[var(--t4)]">
              {refreshing ? 'refreshing...' : timeSinceRefresh}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'conflict' && (
        <>
          <ConflictBanner
            collection={collection}
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
          <ChannelView channel={channel} showImages={showImages} feedData={feedData} />
        </>
      )}

      {viewMode === 'all' && <AllFeedsView showImages={showImages} feedData={feedData} />}
    </div>
  );
}
