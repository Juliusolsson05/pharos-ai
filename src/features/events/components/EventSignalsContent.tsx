'use client';
import { XPostCard } from '@/shared/components/shared/XPostCard';

import { cn } from '@/shared/lib/utils';

import type { XPost } from '@/types/domain';

type Props = {
  xPosts: XPost[];
  compact?: boolean;
  pageScroll?: boolean;
};

export function EventSignalsContent({ xPosts, compact = false, pageScroll = false }: Props) {
  return (
    <div className={cn(compact ? (pageScroll ? 'safe-px py-3' : 'px-3 py-3') : 'px-4 py-3')}>
      {xPosts.length === 0 ? (
        <div className="p-12 text-center">
          <span className="text-xl text-[var(--t3)]">𝕏</span>
          <p className="label text-[var(--t3)] mt-2">
            No signals indexed for this event
          </p>
        </div>
      ) : (
        <>
          <div className="mb-2.5">
            <span className="label text-[length:var(--text-tiny)]">
              {xPosts.length} POSTS · PHAROS-CURATED · CHRONOLOGICAL
            </span>
          </div>
          {xPosts.map(p => <XPostCard key={p.id} post={p as XPost} />)}
        </>
      )}
    </div>
  );
}
