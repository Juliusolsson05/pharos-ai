'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NewsTimeline } from '@/features/news/components/NewsTimeline';
import { useRssFeeds } from '@/features/news/queries';
import { PERSPECTIVE_COLORS } from '@/features/news/lib/news-colors';
import { timeAgo } from '@/shared/lib/format';
import { clientCache, CLIENT_FRESH_TTL } from '@/features/news/lib/client-cache';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import type { FeedItem } from '@/types/domain';

type ViewMode = 'feed' | 'timeline';

export function TimelineContent() {
  const { data: feeds } = useRssFeeds();
  const allFeeds = useMemo(() => feeds ?? [], [feeds]);
  const [feedData,    setFeedData]    = useState<Map<string, FeedItem[]>>(new Map());
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [view,        setView]        = useState<ViewMode>('feed');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLandscapePhone = useIsLandscapePhone();
  const isMobile = useIsMobile();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);

  useEffect(() => {
    if (isMobile && view !== 'feed') setView('feed');
  }, [isMobile, view]);

  const fetchFeeds = useCallback(async () => {
    setRefreshing(true);
    try {
      const allIds = allFeeds.map(f => f.id);
      const staleIds = allIds.filter(id => {
        const cached = clientCache.get(id);
        return !cached || Date.now() - cached.fetchedAt > CLIENT_FRESH_TTL;
      });

      if (staleIds.length === 0) {
        const map = new Map<string, FeedItem[]>();
        allIds.forEach(id => { const c = clientCache.get(id); if (c) map.set(id, c.items); });
        setFeedData(map);
        setRefreshing(false);
        return;
      }

      const res = await fetch('/api/v1/rss/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: staleIds }),
      });
      const data = await res.json();
      const now = Date.now();
      for (const feed of data.feeds ?? []) {
        if (feed.items?.length > 0) clientCache.set(feed.feedId, { feedId: feed.feedId, items: feed.items, fetchedAt: now });
      }
      const map = new Map<string, FeedItem[]>();
      allIds.forEach(id => { const c = clientCache.get(id); if (c) map.set(id, c.items); });
      setFeedData(map);
      setLastRefresh(now);
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [allFeeds]);

  useEffect(() => { fetchFeeds(); }, [fetchFeeds]);
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchFeeds(), 5 * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchFeeds]);

  // Flatten + sort all articles newest first for the feed view
  const allArticles = useMemo(() => {
    const items: { item: FeedItem; feedId: string }[] = [];
    feedData.forEach((feedItems, feedId) => {
      for (const item of feedItems) {
        items.push({ item, feedId });
      }
    });
    return items.sort((a, b) => {
      const ta = new Date(a.item.isoDate ?? a.item.pubDate ?? 0).getTime();
      const tb = new Date(b.item.isoDate ?? b.item.pubDate ?? 0).getTime();
      return tb - ta;
    });
  }, [feedData]);

  const totalArticles = allArticles.length;

  return (
    <div
      className={`flex flex-col w-full h-full min-h-0 ${isLandscapePhone ? 'overflow-y-auto' : ''}`}
      onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
    >
      {/* Top bar */}
      <div className={`py-2 border-b border-[var(--bd)] bg-[var(--bg-app)] shrink-0 overflow-x-auto ${isLandscapePhone ? 'safe-px' : 'px-5'}`}>
        <div className="flex items-center justify-between gap-6 min-w-max">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/data/news"
              className="mono text-[10px] text-[var(--t4)] hover:text-[var(--t2)] no-underline transition-colors"
            >
              ← FEEDS
            </Link>
            <div className="w-px h-4 bg-[var(--bd)]" />
            <span className="mono text-[10px] font-bold text-[var(--t1)] tracking-wider">
              {isMobile || view === 'feed' ? 'ALL ARTICLES' : 'TIMELINE VIEW'}
            </span>
            {(isMobile || view === 'feed') && (
              <span className="mono text-[9px] text-[var(--t4)]">{totalArticles} articles</span>
            )}
          </div>

          <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex border border-[var(--bd)] overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('feed')}
              className={`px-3 py-1 h-auto rounded-none mono text-[9px] font-bold tracking-wider ${
                view === 'feed' ? 'bg-white/10 text-white' : 'text-[var(--t4)] hover:text-[var(--t2)]'
              }`}
            >
              ☰ FEED
            </Button>
            {!isMobile && (
              <>
                <div className="w-px bg-[var(--bd)]" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('timeline')}
                  className={`px-3 py-1 h-auto rounded-none mono text-[9px] font-bold tracking-wider ${
                    view === 'timeline' ? 'bg-white/10 text-white' : 'text-[var(--t4)] hover:text-[var(--t2)]'
                  }`}
                >
                  ↔ TIMELINE
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchFeeds()}
            disabled={refreshing}
            className="flex items-center gap-2 h-auto px-2 py-1 mono text-[9px] text-[var(--t4)] hover:text-[var(--t2)] disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className={refreshing ? 'animate-spin' : ''}>
              <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" />
              <path d="M1 1v4h4M11 11v-4h-4" />
            </svg>
            REFRESH
          </Button>

          <div className="flex items-center gap-2">
            <div className={`dot ${refreshing ? 'dot-warn' : 'dot-live'}`} />
            <span className="mono text-[9px] text-[var(--t4)]">
              {refreshing ? 'loading…' : lastRefresh ? `${Math.floor((Date.now() - lastRefresh) / 1000)}s ago` : '…'}
            </span>
          </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {!isMobile && view === 'timeline' ? (
        <NewsTimeline feedData={feedData} />
      ) : (
        <div className={isLandscapePhone ? '' : 'flex-1 overflow-y-auto min-h-0'}>
          {refreshing && allArticles.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
            </div>
          ) : (
            allArticles.map(({ item, feedId }, i) => {
              const feed = allFeeds.find(f => f.id === feedId);
              const color = feed ? (PERSPECTIVE_COLORS[feed.perspective] ?? '#6b7280') : '#6b7280';
              return (
                <a
                  key={`${feedId}-${i}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-3 py-3 border-b border-[var(--bd)] hover:bg-[var(--bg-2)] transition-colors no-underline group ${isLandscapePhone ? 'safe-px' : 'px-5'}`}
                >
                  {/* Feed logo */}
                  <div className="w-6 h-6 rounded shrink-0 mt-0.5 overflow-hidden bg-[var(--bg-3)] flex items-center justify-center">
                    <Image
                      src={`/logos/feeds/${feedId}.png`}
                      alt={feed?.name ?? feedId}
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      unoptimized
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="mono text-[9px] font-bold shrink-0" style={{ color }}>
                        {feed?.name ?? feedId}
                      </span>
                      <span className="mono text-[8px] text-[var(--t4)]">
                        {timeAgo(item.isoDate ?? item.pubDate)}
                      </span>
                      {feed?.stateFunded && (
                        <span className="mono text-[7px] font-bold text-amber-400/70 tracking-wider">STATE</span>
                      )}
                    </div>
                    <p className="text-[12px] text-[var(--t1)] leading-snug group-hover:text-white transition-colors">
                      {item.title}
                    </p>
                    {item.contentSnippet && (
                      <p className="text-[10px] text-[var(--t4)] mt-0.5 leading-relaxed line-clamp-2">
                        {item.contentSnippet}
                      </p>
                    )}
                  </div>

                  {/* Article image — right side */}
                  {item.imageUrl && (
                    <div className="w-[88px] h-[60px] rounded overflow-hidden shrink-0 bg-[var(--bg-2)]">
                      <Image
                        src={item.imageUrl}
                        alt=""
                        width={88}
                        height={60}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                        unoptimized
                      />
                    </div>
                  )}
                </a>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
