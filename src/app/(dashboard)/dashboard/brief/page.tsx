'use client';
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';

import { BriefContent } from '@/features/brief/components/BriefContent';
import { BriefScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

export default function BriefPage() {
  return (
    <Suspense fallback={<BriefScreenSkeleton />}>
      <BriefContent />
    </Suspense>
  );
}
