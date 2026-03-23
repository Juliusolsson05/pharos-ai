'use client';

import { useEffect, useMemo, useRef,useState } from 'react';

import { Maximize2, Minimize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { MapStory } from '@/types/domain';

import { groupByDay } from './story-utils';
import { StoryDateGroup } from './StoryDateGroup';
import { StoryTimeline } from './StoryTimeline';

// Types

type Props = {
  isOpen:          boolean;
  stories:         MapStory[];
  activeStory:     MapStory | null;
  onToggle:        () => void;
  onActivateStory: (story: MapStory) => void;
  onClearStory:    () => void;
  expanded?:       boolean;
  onToggleExpand?: () => void;
};

// Component

export function MapSidebar({ isOpen, stories, activeStory, onToggle, onActivateStory, onClearStory, expanded, onToggleExpand }: Props) {
  const [openStoryId, setOpenStoryId] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const bodyRef = useRef<HTMLDivElement>(null);

  const days = useMemo(
    () => groupByDay(stories, { dayOrder: 'desc', storyOrder: 'desc' }),
    [stories],
  );

  // Auto-expand date group when a story is activated
  useEffect(() => {
    if (!activeStory) return;
    const group = days.find(d => d.stories.some(s => s.id === activeStory.id));
    if (!group || expandedDates.has(group.date)) return;
    const timer = setTimeout(() => {
      setExpandedDates(prev => new Set(prev).add(group.date));
    }, 0);
    return () => clearTimeout(timer);
  }, [activeStory, days, expandedDates]);

  // Scroll the active story card into view after the date group expands
  useEffect(() => {
    if (!openStoryId || !bodyRef.current) return;
    // Small delay so the date group has time to expand and render cards
    const timer = setTimeout(() => {
      const el = bodyRef.current?.querySelector(`[data-story-id="${openStoryId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
    return () => clearTimeout(timer);
  }, [openStoryId]);

  const handleToggleStory = (story: MapStory) => {
    const opening = openStoryId !== story.id;
    setOpenStoryId(opening ? story.id : null);
    if (opening) onActivateStory(story);
    else onClearStory();
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      background:    'var(--bg-app)',
      overflow:      'hidden',
      height:        '100%',
    }}>
      {/* Header */}
      <div className="panel-header">
        <span style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 'var(--text-body)' }}>◈ STORIES</span>
        <span className="label" style={{
          background: 'var(--bg-3)', color: 'var(--t4)',
          padding: '1px 6px', borderRadius: 2, marginLeft: 4,
        }}>AI CURATED</span>
        <span style={{
          background: 'var(--blue-dim)', color: 'var(--blue-l)',
          fontSize: 'var(--text-caption)', fontWeight: 700, padding: '2px 6px', borderRadius: 10, marginLeft: 2,
        }}>{stories.length}</span>
        {onToggleExpand && (
          <Button variant="ghost" size="xs" onClick={onToggleExpand}
            className="ml-auto h-5 w-5 p-0 text-[var(--t4)] hover:text-[var(--t1)] leading-none"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 size={12} strokeWidth={2} /> : <Maximize2 size={12} strokeWidth={2} />}
          </Button>
        )}
        <Button variant="ghost" size="xs" onClick={onToggle}
          className={`${onToggleExpand ? '' : 'ml-auto '}h-5 w-5 p-0 text-[var(--t4)] hover:text-[var(--t1)] text-base leading-none`}
        >✕</Button>
      </div>

      {/* Timeline */}
      <StoryTimeline
        stories={stories}
        activeId={activeStory?.id ?? null}
        onActivate={(story) => { setOpenStoryId(story.id); onActivateStory(story); }}
      />

      {/* Stories list — grouped by date */}
      <div ref={bodyRef} className="panel-body">
        {days.map(group => (
          <StoryDateGroup
            key={group.date}
            group={group}
            isExpanded={expandedDates.has(group.date)}
            onToggle={() => toggleDate(group.date)}
            openStoryId={openStoryId}
            onToggleStory={handleToggleStory}
            onFlyTo={onActivateStory}
          />
        ))}
      </div>
    </div>
  );
}
