'use client';
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';

import { ActorsContent } from '@/features/actors/components/ActorsContent';
import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

export default function ActorsPage() {
  return (
    <Suspense fallback={<ListDetailScreenSkeleton />}>
      <ActorsContent />
    </Suspense>
  );
}
