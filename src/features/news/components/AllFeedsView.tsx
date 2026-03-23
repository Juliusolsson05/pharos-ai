'use client';

import { useMemo,useState } from 'react';

import { Button } from '@/components/ui/button';

import { PERSPECTIVE_COLORS } from '@/features/news/lib/news-colors';
import { useRssFeeds } from '@/features/news/queries';

import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';

import type { FeedItem } from '@/types/domain';

import { NewsFeedColumn } from './NewsFeedColumn';

const PERSPECTIVES = ['ALL', 'WESTERN', 'US_GOV', 'ISRAELI', 'IRANIAN', 'ARAB', 'RUSSIAN', 'CHINESE', 'INDEPENDENT'] as const;

type Props = {
  showImages: boolean;
  feedData: Map<string, FeedItem[]>;
};

export function AllFeedsView({ showImages, feedData }: Props) {
  const { data: feeds } = useRssFeeds();
  const allFeeds = useMemo(() => feeds ?? [], [feeds]);
  const [filter, setFilter] = useState<string>('ALL');
  const isLandscapePhone = useIsLandscapePhone();

  const filtered = useMemo(
    () => filter === 'ALL' ? allFeeds : allFeeds.filter(f => f.perspective === filter),
    [filter, allFeeds],
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {/* Filter bar */}
      <div className={`${isLandscapePhone ? 'safe-px' : 'px-5'} py-2 bg-[var(--bg-2)] border-b border-[var(--bd)] flex items-center gap-2 shrink-0`}>
        <span className="text-[length:var(--text-caption)] mono text-[var(--t4)] mr-2 shrink-0">FILTER:</span>
        <div className="flex gap-1 overflow-x-auto">
          {PERSPECTIVES.map(p => (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(p)}
              className={`
                px-2 py-1 h-auto rounded text-[length:var(--text-caption)] mono font-bold tracking-wider transition-colors shrink-0
                ${filter === p
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-[var(--t4)] hover:text-[var(--t2)] hover:bg-[var(--bg-1)] border border-transparent'
                }
              `}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PERSPECTIVE_COLORS[p] }} />
                {p.replace('_', ' ')}
              </div>
            </Button>
          ))}
        </div>
        <span className="text-[length:var(--text-tiny)] mono text-[var(--t4)] ml-auto shrink-0">
          {filtered.length} feeds
        </span>
      </div>

      {/* Horizontal scrollable feed columns */}
      <div className={`flex-1 min-h-0 overflow-x-auto overflow-y-hidden ${isLandscapePhone ? 'safe-px' : ''}`}>
        <div className="flex h-full" style={{ width: `max(100%, ${filtered.length * 320}px)` }}>
          {filtered.map(feed => (
            <div
              key={feed.id}
              className="border-r border-[var(--bd)] last:border-r-0 h-full overflow-hidden"
              style={{ width: `${320}px`, minWidth: '280px', flexShrink: 0 }}
            >
              <NewsFeedColumn
                feed={feed}
                color={PERSPECTIVE_COLORS[feed.perspective] ?? 'var(--t4)'}
                showImages={showImages}
                preloaded={feedData.get(feed.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
