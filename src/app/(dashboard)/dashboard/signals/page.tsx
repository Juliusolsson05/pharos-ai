'use client';
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';

import { SignalsContent } from '@/features/signals/components/SignalsContent';
import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

export default function SignalsPage() {
  return (
    <Suspense fallback={<ListDetailScreenSkeleton />}>
      <SignalsContent />
    </Suspense>
  );
}
