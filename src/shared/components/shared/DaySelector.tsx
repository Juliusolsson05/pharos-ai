'use client';

import { useState } from 'react';

import { ChevronDown,ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger } from '@/components/ui/popover';

import { useConflictDays } from '@/features/dashboard/queries/conflicts';
import { useEvents } from '@/features/events/queries';
import { DayPickerDropdown } from '@/shared/components/shared/DayPickerDropdown';

import { dayLabel, dayShort } from '@/shared/lib/day-filter';
import { useConflictDay } from '@/shared/hooks/use-conflict-day';

type Props = {
  currentDay: string;
  onDayChange: (day: string) => void;
  showAll?: boolean;
  allSelected?: boolean;
  onAllClick?: () => void;
};

export function DaySelector({ currentDay, onDayChange, showAll, allSelected, onAllClick }: Props) {
  const [open, setOpen] = useState(false);
  const { allDays } = useConflictDay();
  const { data: events } = useEvents();
  const { data: snapshots } = useConflictDays();
  const idx = allDays.indexOf(currentDay);
  const canPrev = idx > 0;
  const canNext = idx < allDays.length - 1;
  const evtCount = events?.filter(e => e.timestamp.startsWith(currentDay)).length ?? 0;

  function handleSelect(day: string) {
    onDayChange(day);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-[5px] overflow-x-auto touch-scroll hide-scrollbar">
      {showAll && (
        <Button
          variant="outline"
          size="xs"
          onClick={onAllClick}
          className="mono text-[length:var(--text-caption)] font-bold tracking-[0.06em] rounded-none shrink-0"
          style={{
            borderColor: allSelected ? 'var(--blue)' : 'var(--bd)',
            background: allSelected ? 'var(--blue-dim)' : undefined,
            color: allSelected ? 'var(--blue-l)' : 'var(--t3)',
          }}
        >
          ALL
        </Button>
      )}

      <Button
        variant="outline"
        size="icon-xs"
        onClick={() => canPrev && onDayChange(allDays[idx - 1])}
        disabled={!canPrev}
        className="rounded-none shrink-0"
        style={{ borderColor: 'var(--bd)' }}
      >
        <ChevronLeft size={12} strokeWidth={2} className="text-[var(--t3)]" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="xs"
            className="flex items-center gap-1.5 min-w-[112px] justify-center rounded-none shrink-0"
            style={{
              borderColor: allSelected ? 'var(--bd)' : 'var(--danger)',
              background: allSelected ? undefined : 'var(--danger-dim)',
            }}
          >
            <span
              className="mono text-[length:var(--text-caption)] font-bold tracking-[0.08em]"
              style={{ color: allSelected ? 'var(--t3)' : 'var(--danger)' }}
            >
              {dayLabel(currentDay, allDays)}
            </span>
            <span
              className="mono text-[length:var(--text-tiny)]"
              style={{ color: allSelected ? 'var(--t4)' : 'var(--danger)' }}
            >
              {dayShort(currentDay)}
            </span>
            <span
              className="mono text-[length:var(--text-micro)]"
              style={{ color: allSelected ? 'var(--t4)' : 'var(--danger)' }}
            >
              {evtCount}E
            </span>
            <ChevronDown
              size={10}
              strokeWidth={2}
              style={{ color: allSelected ? 'var(--t4)' : 'var(--danger)' }}
            />
          </Button>
        </PopoverTrigger>

        <DayPickerDropdown
          currentDay={currentDay}
          allSelected={allSelected}
          onSelect={handleSelect}
          allDays={allDays}
          events={events ?? []}
          snapshots={snapshots ?? []}
        />
      </Popover>

      <Button
        variant="outline"
        size="icon-xs"
        onClick={() => canNext && onDayChange(allDays[idx + 1])}
        disabled={!canNext}
        className="rounded-none shrink-0"
        style={{ borderColor: 'var(--bd)' }}
      >
        <ChevronRight size={12} strokeWidth={2} className="text-[var(--t3)]" />
      </Button>
    </div>
  );
}
