'use client';

import { ChevronDown,ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { MapStory } from '@/types/domain';

import type { DayGroup } from './story-utils';
import { StoryCard } from './StoryCard';

type Props = {
  group:       DayGroup;
  isExpanded:  boolean;
  onToggle:    () => void;
  openStoryId: string | null;
  onToggleStory: (story: MapStory) => void;
  onFlyTo:       (story: MapStory) => void;
};

export function StoryDateGroup({
  group,
  isExpanded,
  onToggle,
  openStoryId,
  onToggleStory,
  onFlyTo,
}: Props) {
  return (
    <div>
      {/* Date header */}
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center gap-2 h-auto rounded-none justify-start mono px-4 py-2 text-[length:var(--text-label)] font-bold text-[var(--t4)] bg-[var(--bg-1)] border-b border-[var(--bd-s)] tracking-[0.06em]"
      >
        {isExpanded
          ? <ChevronDown size={12} strokeWidth={2.5} />
          : <ChevronRight size={12} strokeWidth={2.5} />}
        {group.label}
        <span className="bg-[var(--bg-3)] text-[var(--t4)] text-[length:var(--text-tiny)] px-1.5 py-px rounded-sm ml-0.5">
          {group.stories.length}
        </span>
      </Button>

      {/* Nested story cards */}
      {isExpanded && group.stories.map(story => (
        <div key={story.id} data-story-id={story.id}>
          <StoryCard
            story={story}
            isOpen={openStoryId === story.id}
            onToggle={() => onToggleStory(story)}
            onFlyTo={() => onFlyTo(story)}
          />
        </div>
      ))}
    </div>
  );
}
