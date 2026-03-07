'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ConflictBanner } from '@/features/news/components/ConflictBanner';
import { ChannelView } from '@/features/news/components/ChannelView';
import { AllFeedsView } from '@/features/news/components/AllFeedsView';
import { useRssFeeds, useRssCollections } from '@/features/news/queries';
import { clientCache, CLIENT_FRESH_TTL } from '@/features/news/lib/client-cache';
import { useIsLandscapePhone } from '@/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/hooks/use-landscape-scroll-emitter';
import type { FeedItem } from '@/types/domain';

type ViewMode = 'conflict' | 'all';

export function NewsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('conflict');
  const [activeChannel, setActiveChannel] = useState(0);
  const [showImages, setShowImages] = useState(true);
  const [feedData, setFeedData] = useState<Map<string, FeedItem[]>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);

  const { data: feeds } = useRssFeeds();
  const { data: collections } = useRssCollections();
  const allFeeds = useMemo(() => feeds ?? [], [feeds]);

  const collection = collections?.[0];
  const channel = collection?.channels[activeChannel];

  // Batch fetch all feeds (or just the ones needed)
  const fetchFeeds = useCallback(async (ids?: string[]) => {
    setRefreshing(true);
    try {
      const feedIds = ids ?? allFeeds.map(f => f.id);

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
      const res = await fetch('/api/v1/rss/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: staleIds }),
      });
      const data = await res.json();

      // Update client cache — always update if items present; for empty/error
      // feeds, only update if we don't already have cached items (preserve stale data)
      const now = Date.now();
      for (const feed of data.feeds ?? []) {
        if (feed.items?.length > 0) {
          clientCache.set(feed.feedId, {
            feedId: feed.feedId,
            items: feed.items,
            fetchedAt: now,
          });
        } else if (!clientCache.has(feed.feedId)) {
          clientCache.set(feed.feedId, {
            feedId: feed.feedId,
            items: [],
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
  }, [allFeeds]);

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
    <div
      className={`flex flex-col w-full h-full min-h-0 ${isLandscapePhone ? 'overflow-y-auto' : ''}`}
      onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
    >
      {/* Top bar */}
      <div className={`py-2 border-b border-[var(--bd)] bg-[var(--bg-app)] shrink-0 overflow-x-auto ${isLandscapePhone ? 'safe-px' : 'px-5'}`}>
        <div className="flex items-center justify-between gap-6 min-w-max">
          <div className="flex items-center gap-3">
            <span className="mono text-[10px] font-bold text-[var(--t3)] tracking-wider">
              RSS MONITOR
            </span>
            <div className="w-px h-4 bg-[var(--bd)]" />
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('conflict')}
                className={`px-3 py-1 h-auto rounded text-[9px] mono font-bold tracking-wider ${
                  viewMode === 'conflict'
                    ? 'bg-[var(--danger-dim)] text-[var(--danger)] border border-[var(--danger-bd)]'
                    : 'text-[var(--t4)] hover:text-[var(--t2)]'
                }`}
              >
                CONFLICTS
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 h-auto rounded text-[9px] mono font-bold tracking-wider ${
                  viewMode === 'all'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-[var(--t4)] hover:text-[var(--t2)]'
                }`}
              >
                ALL FEEDS
              </Button>
              <Link
                href="/dashboard/data/news/timeline"
                className="px-3 py-1 rounded text-[9px] mono font-bold tracking-wider text-[var(--t4)] hover:text-[var(--t2)] no-underline transition-colors"
              >
                TIMELINE →
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
          {/* Image toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImages(v => !v)}
            className={`flex items-center gap-2 h-auto px-2.5 py-1 text-[9px] mono tracking-wider ${
              showImages
                ? 'bg-[var(--blue-dim)] text-[var(--blue-l)] border-[var(--blue)]'
                : 'text-[var(--t4)] hover:text-[var(--t2)] border-transparent'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1" y="2" width="10" height="8" rx="1" />
              <circle cx="4" cy="5" r="1" />
              <path d="M1 9 L4 6 L6 8 L8 5 L11 9" />
            </svg>
            {showImages ? 'ON' : 'OFF'}
          </Button>

          {/* Manual refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchFeeds()}
            disabled={refreshing}
            className="flex items-center gap-2 h-auto px-2 py-1 text-[9px] mono text-[var(--t4)] hover:text-[var(--t2)] disabled:opacity-40"
          >
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={refreshing ? 'animate-spin' : ''}
            >
              <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" />
              <path d="M1 1v4h4M11 11v-4h-4" />
            </svg>
            REFRESH
          </Button>

          <div className="flex items-center gap-2">
            <div className={`dot ${refreshing ? 'dot-warn' : 'dot-live'}`} />
            <span className="mono text-[9px] text-[var(--t4)]">
              {refreshing ? 'refreshing...' : timeSinceRefresh}
            </span>
          </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'conflict' && collection && channel && (
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
