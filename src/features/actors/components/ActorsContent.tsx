'use client';

import { useCallback, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ArrowLeft, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ResizableHandle,ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

import { ActorDossier } from '@/features/actors/components/ActorDossier';
import { ActorList } from '@/features/actors/components/ActorList';
import { useActor, useActors } from '@/features/actors/queries';
import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';
import { DaySelector } from '@/shared/components/shared/DaySelector';
import { EmptyState } from '@/shared/components/shared/EmptyState';

import { track } from '@/shared/lib/analytics';
import { useConflictDay } from '@/shared/hooks/use-conflict-day';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';
import { usePanelLayout } from '@/shared/hooks/use-panel-layout';

export function ActorsContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentDay, setDay } = useConflictDay();
  const isMobile = useIsMobile(1024);
  const isLandscapePhone = useIsLandscapePhone();
  const usePageScroll = isMobile && isLandscapePhone;
  const onLandscapeScroll = useLandscapeScrollEmitter(usePageScroll);

  const selId = searchParams.get('actor');
  const [tab,   setTab]   = useState<'intel' | 'signals' | 'military'>('intel');
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'actors' });

  const { data: actors, isLoading } = useActors(undefined, currentDay || undefined);
  const { data: actorDetail } = useActor(undefined, selId ?? undefined);
  const selected = actorDetail ?? actors?.find(a => a.id === selId) ?? null;

  const handleSelect = useCallback((id: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (id) next.set('actor', id);
    else next.delete('actor');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    if (id) {
      setTab('intel');
      track('actor_selected', { actor_id: id });
    }
  }, [pathname, router, searchParams]);

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
                onClick={() => handleSelect(null)}
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
            onSelect={handleSelect}
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
          onSelect={handleSelect}
          currentDay={currentDay}
          onDayChange={setDay}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="dossier" defaultSize="78%" minSize="40%" className="flex flex-col overflow-hidden">
        {selected
          ? <ActorDossier actor={selected} tab={tab} onTabChange={t => { setTab(t); track('actor_tab_changed', { tab: t, actor_id: selected.id }); }} currentDay={currentDay} />
          : <EmptyState icon={Users} message="Select an actor" />
        }
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
