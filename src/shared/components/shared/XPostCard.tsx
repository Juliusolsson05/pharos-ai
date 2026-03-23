'use client';
import { Suspense } from 'react';

import { Tweet } from 'react-tweet';

import type { XPost } from '@/types/domain';

import { EmbedSkeleton, PharosView } from './PharosView';
import { ACCT, SIG_BORDER, xUrl } from './x-post-constants';

type Props = { post: XPost; compact?: boolean };

export function XPostCard({ post, compact }: Props) {
  const acct       = ACCT[post.accountType] ?? ACCT.analyst;
  const border     = SIG_BORDER[post.significance] ?? SIG_BORDER.STANDARD;
  const postUrl    = xUrl(post.handle, post.tweetId);
  const hasEmbed   = !!post.tweetId && !compact;

  return (
    <div className="card mb-2" style={{ borderLeft: `3px solid ${border}` }}>

      {hasEmbed ? (
        <div className="grid h-[min(78vh,760px)] min-h-[640px] min-w-0 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden lg:h-auto lg:min-h-0 lg:grid-cols-[1fr_1fr] lg:grid-rows-1">
          <div
            data-theme="dark"
            className="min-h-0 overflow-y-auto border-b border-[var(--bd-s)] px-1 py-2 [&_>_div]:!my-0 lg:border-r lg:border-b-0"
          >
            <div className="flex items-center gap-1 px-2 pb-1.5">
              <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-[0.08em]">ORIGINAL</span>
            </div>
            <Suspense fallback={<EmbedSkeleton />}>
              <Tweet id={post.tweetId!} />
            </Suspense>
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-y-auto">
            <div className="flex items-center gap-1 px-3 py-1.5">
              <span className="mono text-[length:var(--text-tiny)] text-[var(--blue-l)] tracking-[0.08em]">PHAROS INTEL</span>
            </div>
            <PharosView post={post} acct={acct} postUrl={postUrl} />
          </div>
        </div>
      ) : <PharosView post={post} acct={acct} postUrl={postUrl} compact={compact} />}
    </div>
  );
}
