'use client';

import { useCallback, useEffect, useMemo,useRef, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { MapStory } from '@/types/domain';

import { groupByDay } from './story-utils';
import { StoryIcon } from './StoryIcon';

// Types

type Props = {
  stories:    MapStory[];
  activeId:   string | null;
  onActivate: (story: MapStory) => void;
};

const DAY_W = 80; // px per day column

// Component

export function StoryTimeline({ stories, activeId, onActivate }: Props) {
  const days = useMemo(
    () => groupByDay(stories, { dayOrder: 'asc', storyOrder: 'asc' }),
    [stories],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollL, setCanScrollL] = useState(false);
  const [canScrollR, setCanScrollR] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollL(el.scrollLeft > 0);
    setCanScrollR(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Recheck on mount + resize
  useEffect(() => {
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, [checkOverflow, days.length]);

  // Auto-scroll active story's day into view
  useEffect(() => {
    if (!activeId || !scrollRef.current) return;
    const dayIdx = days.findIndex(d => d.stories.some(s => s.id === activeId));
    if (dayIdx < 0) return;
    const el = scrollRef.current;
    const target = dayIdx * DAY_W;
    const left = Math.max(0, target - el.clientWidth / 2 + DAY_W / 2);
    el.scrollTo({ left, behavior: 'smooth' });
  }, [activeId, days]);

  const nudge = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * DAY_W * 2, behavior: 'smooth' });
  };

  return (
    <div
      className="flex-shrink-0"
      style={{
        background: 'var(--bg-app)',
        borderBottom: '1px solid var(--bd-s)',
        padding: '8px 12px 10px',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="label" style={{ color: 'var(--t4)' }}>TIMELINE</span>
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">
          {days[0]?.label} – {days[days.length - 1]?.label}
        </span>
      </div>

      {/* Scrollable row with edge arrows */}
      <div className="relative flex items-center">
        {canScrollL && (
          <Button
            variant="outline"
            size="icon-xs"
            className="absolute left-0 z-10"
            onClick={() => nudge(-1)}
          >
            <ChevronLeft />
          </Button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkOverflow}
          className="flex overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {days.map((day, di) => (
            <div
              key={day.date}
              className="shrink-0"
              style={{
                width: DAY_W,
                borderLeft: di > 0 ? '1px solid var(--bd-s)' : undefined,
                paddingLeft: di > 0 ? 8 : 0,
              }}
            >
              {/* Day label */}
              <div className="mono text-[length:var(--text-tiny)] font-bold text-[var(--t4)] mb-1.5 tracking-wider">
                {day.label}
              </div>

              {/* Story icons — wrap if many */}
              <div className="flex flex-wrap gap-1">
                {day.stories.map(story => {
                  const isActive = story.id === activeId;
                  return (
                    <div
                      key={story.id}
                      onClick={() => onActivate(story)}
                      title={story.title}
                      className="cursor-pointer"
                      style={{
                        borderRadius: 2,
                        outline: isActive ? '2px solid var(--blue)' : '2px solid transparent',
                        outlineOffset: 1,
                        boxShadow: isActive ? '0 0 8px rgba(45,114,210,0.4)' : 'none',
                        transition: 'outline 0.15s, box-shadow 0.15s',
                      }}
                    >
                      <StoryIcon
                        iconName={story.iconName}
                        category={story.category}
                        size={11}
                        boxSize={20}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {canScrollR && (
          <Button
            variant="outline"
            size="icon-xs"
            className="absolute right-0 z-10"
            onClick={() => nudge(1)}
          >
            <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  );
}
