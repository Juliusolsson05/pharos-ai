'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { RssFeed } from '@/data/rssFeeds';

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

interface FeedResult {
  feedId: string;
  feedTitle: string;
  items: FeedItem[];
  error?: string;
  fresh?: boolean;
  cachedAt?: number;
}

interface NewsFeedColumnProps {
  feed: RssFeed;
  color: string;
  showImages?: boolean;
  /** Pre-loaded items from parent batch fetch */
  preloaded?: FeedItem[];
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 0) return 'just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NewsFeedColumn({ feed, color, showImages = false, preloaded }: NewsFeedColumnProps) {
  const [items, setItems] = useState<FeedItem[]>(preloaded ?? []);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(!!preloaded);

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch(`/api/rss?ids=${feed.id}`);
      const data = await res.json();
      const result: FeedResult = data.feeds?.[0];
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
      <div className="px-3 py-2.5 border-b border-[var(--bd)] bg-[var(--bg-1)] flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0">
          <h3 className="mono text-[11px] font-bold text-[var(--t1)] tracking-wide truncate">
            {feed.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[8px] mono text-[var(--t4)]">{feed.country}</span>
            {feed.stateFunded && (
              <span className="px-1 py-0 bg-amber-500/15 border border-amber-500/30 rounded text-[7px] mono font-bold text-amber-400">
                STATE FUNDED
              </span>
            )}
          </div>
        </div>
        <span className="text-[9px] mono text-[var(--t4)] shrink-0">
          {items.length > 0 ? `${items.length}` : ''}
        </span>
      </div>

      {/* Scrollable item list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="px-3 py-6 text-center">
            <span className="text-[10px] text-red-400/60 mono">FEED ERROR</span>
            <p className="text-[9px] text-[var(--t4)] mt-1 break-all">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="px-3 py-6 text-center">
            <span className="text-[10px] text-[var(--t4)] mono">NO ITEMS</span>
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
                <h4 className="text-[11px] text-[var(--t1)] font-medium leading-tight group-hover:text-white line-clamp-3">
                  {item.title}
                </h4>
                {item.contentSnippet && (
                  <p className="text-[9px] text-[var(--t4)] mt-1 leading-relaxed line-clamp-2">
                    {item.contentSnippet}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[8px] mono text-[var(--t4)]">
                    {timeAgo(item.isoDate ?? item.pubDate)}
                  </span>
                  {item.creator && (
                    <span className="text-[8px] mono text-[var(--t4)] truncate max-w-[120px]">
                      {item.creator}
                    </span>
                  )}
                </div>
              </div>

              {showImages && item.imageUrl && (
                <div className="w-[72px] h-[50px] rounded overflow-hidden shrink-0 bg-[var(--bg-2)]">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
