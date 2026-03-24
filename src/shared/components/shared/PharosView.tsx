'use client';
import React from 'react';

import { CheckCircle, ExternalLink, Eye, Heart, Repeat2 } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { ago, fmt } from '@/shared/lib/format';

import type { XPost } from '@/types/domain';

import { getInitials, IMG_BG, IMG_LBL,resolveAvatarColor } from './x-post-constants';
import { EmbedSkeleton, EngStat, PharosNote,VerificationBadge } from './x-post-subcomponents';

// Pharos intel view (reused in both layouts)

type Props = {
  post: XPost;
  acct: { bg: string; text: string; label: string };
  postUrl: string | null;
  compact?: boolean;
};

export function PharosView({ post, acct, postUrl, compact }: Props) {
  const avatarText = getInitials(post.displayName, post.handle, post.avatar);
  const avatarBg = resolveAvatarColor(post);

  return (
    <>
      {/* ── HEADER ── */}
      <div className="card-header px-3 py-[9px]">
        <Avatar
          className="w-8 h-8 shrink-0"
          style={{ background: avatarBg }}
        >
          <AvatarFallback
            className="text-[length:var(--text-label)] font-bold text-white rounded-full"
            style={{ background: avatarBg }}
          >
            {avatarText}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-[var(--t1)] leading-none">{post.displayName}</span>
            {post.verified && (
              <CheckCircle size={11} strokeWidth={2.5} className="text-[var(--blue-l)] shrink-0" />
            )}
            <VerificationBadge status={post.verificationStatus} />
          </div>
          <span className="mono text-[var(--t4)]">{post.handle}</span>
        </div>

        <Badge
          variant="outline"
          className="text-[length:var(--text-caption)] px-[6px] py-0.5 rounded-sm shrink-0 border-transparent tracking-[0.05em]"
          style={{ background: acct.bg, color: acct.text }}
        >
          {acct.label}
        </Badge>

        <span className="mono text-[var(--t4)] shrink-0">{ago(post.timestamp)}</span>
      </div>

      {/* ── BODY ── */}
      <div className="card-body">
        <p
          className={`leading-snug whitespace-pre-wrap text-[var(--t1)]${compact ? ' text-[length:var(--text-body-sm)] line-clamp-3' : ' text-[length:var(--text-body)]'}`}
        >
          {post.content}
        </p>

        {/* Images */}
        {!compact && post.images && post.images.length > 0 && (
          <div
            className="mt-2.5 gap-[3px] grid"
            style={{ gridTemplateColumns: post.images.length === 1 ? '1fr' : '1fr 1fr' }}
          >
            {post.images.map((img: string) => (
              <div
                key={img}
                className="relative overflow-hidden flex items-end p-1.5 border border-[var(--bd)]"
                style={{
                  height: post.images!.length === 1 ? 130 : 80,
                  background: IMG_BG[img] ?? 'var(--bg-app)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.65)]" />
                <span className="label relative uppercase text-[rgba(255,255,255,0.55)]">
                  {IMG_LBL[img] ?? img}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Video placeholder */}
        {!compact && post.videoThumb && (
          <div
            className="flex items-center justify-center relative mt-3 h-[90px] border border-[var(--bd)] bg-[var(--bg-app)]"
          >
            <div className="w-9 h-9 flex items-center justify-center border border-[var(--bd)] bg-white/[0.06]">
              <div
                className="ml-[2px]"
                style={{
                  width: 0, height: 0,
                  borderTop: '7px solid transparent',
                  borderBottom: '7px solid transparent',
                  borderLeft: '12px solid var(--t3)',
                }}
              />
            </div>
            <span className="label absolute bottom-2 left-3">VIDEO</span>
          </div>
        )}
      </div>

      {/* ── FOOTER: engagement metrics (hidden when all zeros) ── */}
      {(post.likes > 0 || post.retweets > 0 || post.views > 0 || postUrl) && (
        <>
          <Separator className="bg-[var(--bd-s)]" />
          <div className="card-footer">
            {(post.likes > 0 || post.retweets > 0 || post.views > 0) && (
              <>
                <EngStat icon={<Heart   size={10} strokeWidth={1.5} />} val={fmt(post.likes)}    />
                <EngStat icon={<Repeat2 size={10} strokeWidth={1.5} />} val={fmt(post.retweets)} />
                <EngStat icon={<Eye     size={10} strokeWidth={1.5} />} val={fmt(post.views)}    />
              </>
            )}
            {postUrl && (
              <div className={post.likes > 0 || post.retweets > 0 || post.views > 0 ? 'ml-auto' : ''}>
                <a href={postUrl} target="_blank" rel="noopener noreferrer" title="View on 𝕏">
                  <ExternalLink size={11} className="text-[var(--t4)] hover:text-[var(--blue-l)] transition-colors cursor-pointer" strokeWidth={1.5} />
                </a>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── PHAROS NOTE ── */}
      {!compact && post.pharosNote && (
        <PharosNote note={post.pharosNote} />
      )}
    </>
  );
}

export { EmbedSkeleton };
