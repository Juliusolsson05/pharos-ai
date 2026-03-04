'use client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterBlock, CheckboxRow } from '@/components/shared/FilterControls';
import { DaySelector } from '@/components/shared/DaySelector';
import type { Severity, EventType } from '@/types/domain';
import type { ConflictDay } from '@/types/domain';
import { SEV_C, TYPE_C } from '@/lib/severity-colors';
import { cn } from '@/lib/utils';

export const ALL_TYPES: EventType[] = ['MILITARY', 'DIPLOMATIC', 'INTELLIGENCE', 'ECONOMIC', 'HUMANITARIAN', 'POLITICAL'];

type Props = {
  sevFilter: Record<Severity, boolean>;
  typeFilter: Record<EventType, boolean>;
  verOnly: boolean;
  totalFiltered: number;
  onSevChange: (s: Severity, v: boolean) => void;
  onTypeChange: (t: EventType, v: boolean) => void;
  onVerChange: (v: boolean) => void;
  currentDay: ConflictDay;
  onDayChange: (day: ConflictDay) => void;
  showAll: boolean;
  onAllClick: () => void;
  compact?: boolean;
  pageScroll?: boolean;
};

export function FeedFilterRail({
  sevFilter, typeFilter, verOnly, totalFiltered,
  onSevChange, onTypeChange, onVerChange,
  currentDay, onDayChange, showAll, onAllClick,
  compact = false, pageScroll = false,
}: Props) {
  const body = (
    <>
      <FilterBlock label="CONFLICT DAY">
        <div className="px-3 py-1">
          <DaySelector
            currentDay={currentDay}
            onDayChange={onDayChange}
            showAll
            allSelected={showAll}
            onAllClick={onAllClick}
          />
        </div>
      </FilterBlock>
      <FilterBlock label="SEVERITY">
        {(['CRITICAL', 'HIGH', 'STANDARD'] as Severity[]).map(s => (
          <CheckboxRow key={s} label={s} color={SEV_C[s]}
            checked={sevFilter[s]} onChange={v => onSevChange(s, v)} />
        ))}
      </FilterBlock>
      <FilterBlock label="VERIFIED">
        <CheckboxRow label="ONLY VERIFIED" color="var(--success)"
          checked={verOnly} onChange={onVerChange} />
      </FilterBlock>
      <FilterBlock label="EVENT TYPE">
        {ALL_TYPES.map(t => (
          <CheckboxRow key={t} label={t} color={TYPE_C[t]}
            checked={typeFilter[t]} onChange={v => onTypeChange(t, v)} />
        ))}
      </FilterBlock>
    </>
  );

  return (
    <div className={cn(pageScroll ? 'flex flex-col' : 'flex-1 flex flex-col overflow-hidden')}>
      <div className={cn('panel-header', compact && 'h-8 min-h-8 px-3')}>
        <span className="section-title">Filters</span>
      </div>
      {pageScroll ? body : <ScrollArea className="flex-1">{body}</ScrollArea>}
      <div className="px-3 py-2 border-t border-[var(--bd)] shrink-0">
        <span className="mono text-[9px] text-[var(--t3)]">{totalFiltered} EVENTS</span>
      </div>
    </div>
  );
}
