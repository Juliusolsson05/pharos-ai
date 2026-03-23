'use client';

import Image from 'next/image';

import { PERSPECTIVE_COLORS } from '@/features/news/lib/news-colors';

import {
  CARD_W,
  formatHour,
  formatTimeAgo,
  IMG_H,
  proxyImg,
  type TimelineArticle,
} from './timeline-constants';

// Types

type Props = {
  article: TimelineArticle;
  x: number;
  cardTop: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
};

// Component

export function NormalCard({ article, x, cardTop, isHovered, onMouseEnter, onMouseLeave, onClick }: Props) {
  const color = PERSPECTIVE_COLORS[article.feed.perspective] ?? 'var(--t4)';
  const hasImg = !!article.imageUrl;

  return (
    <div
      className="absolute"
      style={{ left: `${x}px`, top: `${cardTop}px`, width: `${CARD_W}px`, cursor: 'pointer' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div
        className={`rounded-lg border overflow-hidden transition-all duration-150
          ${isHovered
            ? 'bg-[var(--bg-app)] border-white/30 shadow-2xl shadow-black/50'
            : 'bg-[var(--bg-app)] border-white/15'
          }`}
      >
        {hasImg && (
          <div className="w-full overflow-hidden bg-[#0a0a0f]" style={{ height: `${IMG_H}px` }}>
            <Image
              src={proxyImg(article.imageUrl!)}
              alt={article.title}
              width={CARD_W}
              height={IMG_H}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
              unoptimized
            />
          </div>
        )}
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="px-1.5 py-0.5 rounded text-[length:var(--text-tiny)] mono font-bold leading-none"
              style={{ backgroundColor: `${color}30`, color, border: `1px solid ${color}50` }}
            >
              {article.feed.name.length > 14 ? article.feed.id.toUpperCase() : article.feed.name.toUpperCase()}
            </div>
            {article.feed.stateFunded && (
              <span className="text-[length:var(--text-tiny)] mono font-bold text-amber-400 tracking-wider">STATE</span>
            )}
            <span className="mono text-[length:var(--text-body-sm)] font-bold text-white ml-auto shrink-0">
              {formatHour(article.time)}
            </span>
            <span className="mono text-[length:var(--text-caption)] text-white/70 shrink-0">
              {formatTimeAgo(article.time)}
            </span>
          </div>
          <h4 className="text-xs text-white font-semibold leading-snug line-clamp-2">
            {article.title}
          </h4>
          {article.snippet && (
            <p className="text-[length:var(--text-label)] text-white/70 mt-1 leading-relaxed line-clamp-2">
              {article.snippet}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[length:var(--text-caption)] mono font-bold text-white/60">{article.feed.country}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 - article.feed.tier }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              ))}
              {Array.from({ length: article.feed.tier - 1 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
              ))}
            </div>
            {isHovered && (
              <span className="ml-auto text-[length:var(--text-tiny)] mono text-white/40">click to expand</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
