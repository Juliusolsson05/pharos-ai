'use client';
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';

import { FeedContent } from '@/features/events/components/FeedContent';
import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

export default function IntelFeedPage() {
  return (
    <Suspense fallback={<ListDetailScreenSkeleton />}>
      <FeedContent />
    </Suspense>
  );
}
