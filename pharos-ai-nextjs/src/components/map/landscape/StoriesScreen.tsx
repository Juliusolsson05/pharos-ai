'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { LandscapeHeader } from './LandscapeHeader';
import StoryTimeline from '@/components/map/StoryTimeline';
import StoryDateGroup from '@/components/map/StoryDateGroup';
import { groupByDay } from '@/components/map/story-utils';
import type { MapStory } from '@/types/domain';

type Props = {
  stories: MapStory[];
  activeStory: MapStory | null;
  onBack: () => void;
  onSelectStory: (story: MapStory) => void;
};

export function StoriesScreen({ stories, activeStory, onBack, onSelectStory }: Props) {
  const [openStoryId, setOpenStoryId] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const bodyRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...stories].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [stories],
  );

  const days = useMemo(() => groupByDay(sorted).reverse(), [sorted]);

  // Auto-expand date group when a story is activated
  useEffect(() => {
    if (!activeStory) return;
    const group = days.find(d => d.stories.some(s => s.id === activeStory.id));
    if (group && !expandedDates.has(group.date)) {
      setExpandedDates(prev => new Set(prev).add(group.date));
    }
  }, [activeStory, days, expandedDates]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const handleToggleStory = (story: MapStory) => {
    const opening = openStoryId !== story.id;
    setOpenStoryId(opening ? story.id : null);
    if (opening) onSelectStory(story);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-app)] overflow-hidden">
      <LandscapeHeader title="MAP" onBack={onBack} />

      {/* Story count */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-[var(--bd)] bg-[var(--bg-2)]">
        <span style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 12 }}>◈ STORIES</span>
        <span className="label" style={{
          background: 'var(--bg-3)', color: 'var(--t4)',
          padding: '1px 6px', borderRadius: 2,
        }}>AI CURATED</span>
        <span style={{
          background: 'var(--blue-dim)', color: 'var(--blue-l)',
          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
        }}>{stories.length}</span>
      </div>

      {/* Timeline strip */}
      <StoryTimeline
        stories={sorted}
        activeId={activeStory?.id ?? null}
        onActivate={(story) => { setOpenStoryId(story.id); onSelectStory(story); }}
      />

      {/* Stories list */}
      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto">
        {days.map(group => (
          <StoryDateGroup
            key={group.date}
            group={group}
            isExpanded={expandedDates.has(group.date)}
            onToggle={() => toggleDate(group.date)}
            openStoryId={openStoryId}
            onToggleStory={handleToggleStory}
            onFlyTo={onSelectStory}
          />
        ))}
      </div>
    </div>
  );
}
