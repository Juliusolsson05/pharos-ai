'use client';

import { useRssFeeds } from '@/api/rss';
import type { ConflictChannel, FeedItem } from '@/types/domain';
import { NewsFeedColumn } from './NewsFeedColumn';
import { useIsLandscapePhone } from '@/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/hooks/use-is-mobile';

type ChannelViewProps = {
  channel: ConflictChannel;
  showImages: boolean;
  feedData: Map<string, FeedItem[]>;
};

export function ChannelView({ channel, showImages, feedData }: ChannelViewProps) {
  const { data: allFeeds } = useRssFeeds();
  const isLandscapePhone = useIsLandscapePhone();
  const isMobile = useIsMobile();
  const feeds = channel.feedIds
    .map(id => (allFeeds ?? []).find(f => f.id === id))
    .filter(Boolean) as import('@/types/domain').RssFeed[];

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {/* Channel description bar */}
      <div className={`${isLandscapePhone ? 'safe-px' : 'px-5'} py-2 bg-[var(--bg-2)] border-b border-[var(--bd)] flex items-center gap-3 shrink-0`}>
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: channel.color }} />
        <div className="min-w-0">
          <span className="mono text-[10px] font-bold text-[var(--t2)] tracking-wider">
            {channel.label}
          </span>
          <span className="text-[9px] text-[var(--t4)] ml-3">{channel.description}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-[8px] mono text-[var(--t4)] uppercase tracking-wider">
            {channel.perspective}
          </span>
        </div>
      </div>

      {/* Feed columns */}
      {isMobile ? (
        <div className={`flex-1 min-h-0 overflow-x-auto overflow-y-hidden ${isLandscapePhone ? 'safe-px' : ''}`}>
          <div className="flex h-full" style={{ width: `max(100%, ${feeds.length * 320}px)` }}>
            {feeds.map(feed => (
              <div
                key={feed.id}
                className="border-r border-[var(--bd)] last:border-r-0 h-full overflow-hidden"
                style={{ width: '85vw', minWidth: '280px', maxWidth: '360px', flexShrink: 0 }}
              >
                <NewsFeedColumn
                  feed={feed}
                  color={channel.color}
                  showImages={showImages}
                  preloaded={feedData.get(feed.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="flex-1 min-h-0 grid"
          style={{ gridTemplateColumns: `repeat(${feeds.length}, 1fr)` }}
        >
          {feeds.map(feed => (
            <div key={feed.id} className="min-w-0 border-r border-[var(--bd)] last:border-r-0 overflow-hidden">
              <NewsFeedColumn
                feed={feed}
                color={channel.color}
                showImages={showImages}
                preloaded={feedData.get(feed.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
