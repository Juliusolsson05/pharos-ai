'use client';

import { useMemo, useState } from 'react';
import { Users, ArrowLeft } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { usePanelLayout } from '@/hooks/use-panel-layout';
import { useConflictDay } from '@/hooks/use-conflict-day';
import { useActor, useActors } from '@/features/actors/queries';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useIsLandscapePhone } from '@/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/hooks/use-landscape-scroll-emitter';
import { ActorList } from '@/features/actors/components/ActorList';
import { ActorDossier } from '@/features/actors/components/ActorDossier';
import { EmptyState } from '@/shared/components/shared/EmptyState';
import { DaySelector } from '@/shared/components/shared/DaySelector';
import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

export function ActorsContent() {
  const initActor = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('actor');
  }, []);
  const { currentDay, setDay } = useConflictDay();
  const isMobile = useIsMobile(1024);
  const isLandscapePhone = useIsLandscapePhone();
  const usePageScroll = isMobile && isLandscapePhone;
  const onLandscapeScroll = useLandscapeScrollEmitter(usePageScroll);

  const [selId, setSelId] = useState<string | null>(() => initActor);
  const [tab,   setTab]   = useState<'intel' | 'signals' | 'military'>('intel');
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'actors' });

  const { data: actors, isLoading } = useActors(undefined, currentDay || undefined);
  const { data: actorDetail } = useActor(undefined, selId ?? undefined);
  const selected = actorDetail ?? actors?.find(a => a.id === selId) ?? null;

  if (isLoading) return <ListDetailScreenSkeleton />;

  if (isMobile) {
    return (
      <div
        className={`flex-1 min-h-0 flex flex-col ${usePageScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}
        onScroll={usePageScroll ? onLandscapeScroll : undefined}
      >
        {selected ? (
          <>
            <div className={`panel-header justify-between gap-2 ${usePageScroll ? 'h-8 min-h-8 safe-px' : ''}`}>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelId(null)}
                className="mono h-7 px-2 text-[9px] font-bold tracking-[0.06em]"
              >
                <ArrowLeft size={12} />
                BACK
              </Button>
              <div className="overflow-x-auto touch-scroll hide-scrollbar">
                <DaySelector currentDay={currentDay} onDayChange={setDay} />
              </div>
            </div>
            <ActorDossier actor={selected} tab={tab} onTabChange={setTab} currentDay={currentDay} compact={usePageScroll} pageScroll={usePageScroll} />
          </>
        ) : (
          <ActorList
            selectedId={selId}
            onSelect={id => { setSelId(id); if (id) setTab('intel'); }}
            currentDay={currentDay}
            onDayChange={setDay}
            compact={usePageScroll}
            pageScroll={usePageScroll}
          />
        )}
      </div>
    );
  }

  return (
    <ResizablePanelGroup orientation="horizontal" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} className="flex-1 min-w-0">
      <ResizablePanel id="list" defaultSize="22%" minSize="15%" maxSize="40%" className="flex flex-col overflow-hidden min-w-[180px]">
        <ActorList
          selectedId={selId}
          onSelect={id => { setSelId(id); if (id) setTab('intel'); }}
          currentDay={currentDay}
          onDayChange={setDay}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="dossier" defaultSize="78%" minSize="40%" className="flex flex-col overflow-hidden">
        {selected
          ? <ActorDossier actor={selected} tab={tab} onTabChange={setTab} currentDay={currentDay} />
          : <EmptyState icon={Users} message="Select an actor" />
        }
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
