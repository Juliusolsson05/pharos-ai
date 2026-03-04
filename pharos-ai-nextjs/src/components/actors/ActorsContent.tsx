'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, ArrowLeft } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { usePanelLayout } from '@/hooks/use-panel-layout';
import { useConflictDay } from '@/hooks/use-conflict-day';
import { useActors } from '@/api/actors';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useIsLandscapePhone } from '@/hooks/use-is-landscape-phone';
import { ActorList } from '@/components/actors/ActorList';
import { ActorDossier } from '@/components/actors/ActorDossier';
import { EmptyState } from '@/components/shared/EmptyState';
import { DaySelector } from '@/components/shared/DaySelector';

export function ActorsContent() {
  const searchParams = useSearchParams();
  const initActor    = searchParams.get('actor');
  const { currentDay, setDay } = useConflictDay();
  const isMobile = useIsMobile(1024);
  const isLandscapePhone = useIsLandscapePhone();
  const usePageScroll = isMobile && isLandscapePhone;

  const [selId, setSelId] = useState<string | null>(() => initActor);
  const [tab,   setTab]   = useState<'intel' | 'signals' | 'military'>('intel');
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'actors' });

  const { data: actors } = useActors();
  const selected = actors?.find(a => a.id === selId) ?? null;

  if (isMobile) {
    return (
      <div className={`flex-1 min-h-0 flex flex-col ${usePageScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {selected ? (
          <>
            <div className={`panel-header justify-between gap-2 ${usePageScroll ? 'h-8 min-h-8 px-3' : ''}`}>
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
