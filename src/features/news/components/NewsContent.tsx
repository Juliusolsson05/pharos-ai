'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';

import { AllFeedsView } from '@/features/news/components/AllFeedsView';
import { ChannelView } from '@/features/news/components/ChannelView';
import { ConflictBanner } from '@/features/news/components/ConflictBanner';
import { useRssCollections, useRssFeedItems, useRssFeeds } from '@/features/news/queries';

import { track } from '@/shared/lib/analytics';
import { queryKeys } from '@/shared/lib/query/keys';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';
import { useNow } from '@/shared/hooks/use-now';

type ViewMode = 'conflict' | 'all';

export function NewsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('conflict');
  const [activeChannel, setActiveChannel] = useState(0);
  const [showImages, setShowImages] = useState(true);
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);
  const now = useNow();
  const queryClient = useQueryClient();

  const { data: feeds } = useRssFeeds();
  const { data: collections } = useRssCollections();
  const allFeeds = useMemo(() => feeds ?? [], [feeds]);
  const feedIds = useMemo(() => allFeeds.map(f => f.id), [allFeeds]);

  const { data: feedData, isFetching, dataUpdatedAt } = useRssFeedItems(feedIds);

  const collection = collections?.[0];
  const channel = collection?.channels[activeChannel];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.rss.fetchItems(feedIds) });
    track('news_manual_refresh');
  };

  const timeSinceRefresh = dataUpdatedAt
    ? `${Math.floor((now - dataUpdatedAt) / 1000)}s ago`
    : 'loading...';

  return (
    <div
      className={`flex flex-col w-full h-full min-h-0 ${isLandscapePhone ? 'overflow-y-auto' : ''}`}
      onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
    >
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
                onClick={() => { setViewMode('conflict'); track('news_view_changed', { mode: 'conflict' }); }}
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
                onClick={() => { setViewMode('all'); track('news_view_changed', { mode: 'all' }); }}
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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 h-auto px-2 py-1 text-[9px] mono text-[var(--t4)] hover:text-[var(--t2)] disabled:opacity-40"
          >
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={isFetching ? 'animate-spin' : ''}
            >
              <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" />
              <path d="M1 1v4h4M11 11v-4h-4" />
            </svg>
            REFRESH
          </Button>

          <div className="flex items-center gap-2">
            <div className={`dot ${isFetching ? 'dot-warn' : 'dot-live'}`} />
            <span className="mono text-[9px] text-[var(--t4)]">
              {isFetching ? 'refreshing...' : timeSinceRefresh}
            </span>
          </div>
          </div>
        </div>
      </div>

      {viewMode === 'conflict' && collection && channel && (
        <>
          <ConflictBanner
            collection={collection}
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
          <ChannelView channel={channel} showImages={showImages} feedData={feedData ?? new Map()} />
        </>
      )}

      {viewMode === 'all' && <AllFeedsView showImages={showImages} feedData={feedData ?? new Map()} />}
    </div>
  );
}
