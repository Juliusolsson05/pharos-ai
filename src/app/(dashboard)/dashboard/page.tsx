'use client';

import { Suspense } from 'react';

import { SummaryBar } from '@/features/dashboard/components/SummaryBar';
import { WorkspaceDashboard } from '@/features/dashboard/components/WorkspaceDashboard';
import { OverviewScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';

export default function OverviewPage() {
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 bg-[var(--bg-1)] ${isLandscapePhone ? 'overflow-y-auto' : 'overflow-hidden'}`}
      onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
    >
      <Suspense fallback={<OverviewScreenSkeleton />}>
        <SummaryBar />
        <WorkspaceDashboard />
      </Suspense>
    </div>
  );
}
