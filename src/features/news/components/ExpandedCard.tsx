'use client';

import Image from 'next/image';

import { Button } from '@/components/ui/button';

import {
  CARD_W,
  formatHour,
  formatTimeAgo,
  proxyImg,
  type TimelineArticle,
} from './timeline-constants';

// Types

type Props = {
  article: TimelineArticle;
  x: number;
  cardTop: number;
  above: boolean;
  color: string;
  defocus: () => void;
};

// Component

export function ExpandedCard({ article, x, cardTop, color, defocus }: Props) {
  const EXP_W = CARD_W + 160;
  const expLeft = Math.max(20, x - (EXP_W - CARD_W) / 2);
  const expTop = Math.max(20, cardTop);
  const hasImg = !!article.imageUrl;

  return (
    <div
      className="absolute"
      style={{
        left: `${expLeft}px`,
        top: `${expTop}px`,
        width: `${EXP_W}px`,
        zIndex: 100,
      }}
    >
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: '#0e0e1a',
          borderColor: `${color}50`,
          boxShadow: `0 0 0 1px ${color}20, 0 40px 80px rgba(0,0,0,0.8)`,
        }}
      >
        {hasImg && (
          <div className="w-full overflow-hidden bg-[#0a0a0f]" style={{ height: '180px' }}>
            <Image
              src={proxyImg(article.imageUrl!)}
              alt={article.title}
              width={CARD_W + 160}
              height={180}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
              unoptimized
            />
          </div>
        )}
        <div className="px-5 py-4">
          {/* Source row */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="px-2 py-1 rounded text-[length:var(--text-caption)] mono font-bold"
              style={{ backgroundColor: `${color}25`, color, border: `1px solid ${color}40` }}
            >
              {article.feed.name.toUpperCase()}
            </div>
            {article.feed.stateFunded && (
              <span className="text-[length:var(--text-caption)] mono font-bold text-amber-400">STATE FUNDED</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); defocus(); }}
              className="ml-auto w-6 h-6 text-white/40 hover:text-white text-xl leading-none"
            >
              ×
            </Button>
          </div>
          {/* Time */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="mono text-[length:var(--text-body)] font-bold text-white">
              {article.time.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
            <span className="mono text-[length:var(--text-body)] font-bold text-white">{formatHour(article.time)}</span>
            <span className="mono text-[length:var(--text-body-sm)] text-white/50">{formatTimeAgo(article.time)}</span>
          </div>
          {/* Title */}
          <h3 className="text-base font-bold text-white leading-snug mb-2">
            {article.title}
          </h3>
          {/* Snippet */}
          {article.snippet && (
            <p className="text-xs text-white/75 leading-relaxed mb-4">
              {article.snippet}
            </p>
          )}
          {/* Open link */}
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg no-underline font-bold mono text-[length:var(--text-label)] tracking-wider transition-opacity hover:opacity-80"
            style={{ backgroundColor: color, color: '#000' }}
          >
            OPEN ARTICLE →
          </a>
        </div>
      </div>
    </div>
  );
}
