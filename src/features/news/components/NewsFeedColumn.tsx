'use client';

import { useCallback,useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { fetchSingleFeed } from '@/features/news/queries';

import { timeAgo } from '@/shared/lib/format';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';

import type { FeedItem, FeedResult,RssFeed } from '@/types/domain';

type NewsFeedColumnProps = {
  feed: RssFeed;
  color: string;
  showImages?: boolean;
  /** Pre-loaded items from parent batch fetch */
  preloaded?: FeedItem[];
};

export function NewsFeedColumn({ feed, color, showImages = true, preloaded }: NewsFeedColumnProps) {
  const [items, setItems] = useState<FeedItem[]>(preloaded ?? []);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const fetchedRef = useRef(!!preloaded);
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);

  const loadFeed = useCallback(async () => {
    try {
      const result: FeedResult | null = await fetchSingleFeed(feed.id);
      if (result?.error) {
        if (!items.length) setError(result.error);
      } else if (result?.items) {
        setItems(result.items);
        setError(null);
      }
    } catch (err) {
      if (!items.length) setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [feed.id, items.length]);

  // Initial fetch (if not preloaded)
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadFeed();
  }, [loadFeed]);

  // Update if preloaded changes
  useEffect(() => {
    if (preloaded && preloaded.length > 0) {
      setItems(preloaded);
      setLoading(false);
      setError(null);
    }
  }, [preloaded]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Column header */}
      <div className="px-3 py-2.5 border-b border-[var(--bd)] bg-[var(--bg-1)] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded overflow-hidden shrink-0 bg-[var(--bg-3)] flex items-center justify-center">
          {logoError ? (
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          ) : (
            <Image
              src={`/logos/feeds/${feed.id}.png`}
              alt={feed.name}
              width={28}
              height={28}
              className="w-full h-full object-contain"
              onError={() => setLogoError(true)}
              unoptimized
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--t1)] tracking-wide truncate">
            {feed.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[length:var(--text-tiny)] mono text-[var(--t4)]">{feed.country}</span>
            {feed.stateFunded && (
              <span className="px-1 py-0 bg-amber-500/15 border border-amber-500/30 rounded text-[length:var(--text-micro)] mono font-bold text-amber-400">
                STATE FUNDED
              </span>
            )}
          </div>
        </div>
        <span className="text-[length:var(--text-caption)] mono text-[var(--t4)] shrink-0">
          {items.length > 0 ? `${items.length}` : ''}
        </span>
      </div>

      {/* Scrollable item list */}
      <div
        className="flex-1 overflow-y-auto min-h-0"
        onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
      >
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="px-3 py-6 text-center">
            <span className="text-[length:var(--text-label)] text-red-400/60 mono">FEED ERROR</span>
            <p className="text-[length:var(--text-caption)] text-[var(--t4)] mt-1 break-all">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="px-3 py-6 text-center">
            <span className="text-[length:var(--text-label)] text-[var(--t4)] mono">NO ITEMS</span>
          </div>
        )}

        {items.map((item, idx) => (
          <a
            key={`${item.link}-${idx}`}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2.5 border-b border-[var(--bd)] hover:bg-[var(--bg-2)] transition-colors no-underline group"
          >
            <div className={showImages && item.imageUrl ? 'flex gap-3' : ''}>
              <div className="flex-1 min-w-0">
                <h4 className="text-[length:var(--text-body-sm)] text-[var(--t1)] font-medium leading-tight group-hover:text-white line-clamp-3">
                  {item.title}
                </h4>
                {item.contentSnippet && (
                  <p className="text-[length:var(--text-caption)] text-[var(--t4)] mt-1 leading-relaxed line-clamp-2">
                    {item.contentSnippet}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[length:var(--text-tiny)] mono text-[var(--t4)]">
                    {timeAgo(item.isoDate ?? item.pubDate)}
                  </span>
                  {item.creator && (
                    <span className="text-[length:var(--text-tiny)] mono text-[var(--t4)] truncate max-w-[120px]">
                      {item.creator}
                    </span>
                  )}
                </div>
              </div>

              {showImages && item.imageUrl && (
                <div className="w-[80px] h-[56px] rounded overflow-hidden shrink-0 bg-[var(--bg-2)]">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    width={80}
                    height={56}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    unoptimized
                  />
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
