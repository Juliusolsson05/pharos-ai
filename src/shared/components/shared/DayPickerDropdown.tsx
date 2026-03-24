'use client';

import { Button } from '@/components/ui/button';
import { PopoverContent } from '@/components/ui/popover';

import { dayLabel, getConflictForDay,getEventsForDay } from '@/shared/lib/day-filter';

import type { ConflictDaySnapshot,IntelEvent } from '@/types/domain';

type Props = {
  currentDay: string;
  allSelected?: boolean;
  onSelect: (day: string) => void;
  allDays: string[];
  events: IntelEvent[];
  snapshots: ConflictDaySnapshot[];
};

export function DayPickerDropdown({ currentDay, allSelected, onSelect, allDays, events, snapshots }: Props) {
  return (
    <PopoverContent
      align="start"
      sideOffset={4}
      className="w-[220px] p-0 border-[var(--bd)] bg-[var(--bg-1)] shadow-lg"
    >
      <div className="px-3 py-2 border-b border-[var(--bd)] bg-[var(--bg-2)]">
        <span className="mono text-[length:var(--text-tiny)] font-bold text-[var(--t4)] tracking-[0.10em]">
          CONFLICT TIMELINE — {allDays.length} DAYS
        </span>
      </div>

      <div className="max-h-[280px] overflow-y-auto">
        {allDays.map(day => {
          const isActive = day === currentDay && !allSelected;
          const snap = getConflictForDay(snapshots, day);
          const ec = getEventsForDay(events, allDays, day).length;
          return (
            <Button
              key={day}
              variant="ghost"
              onClick={() => onSelect(day)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-none h-auto text-left"
              style={{
                background: isActive ? 'var(--danger-dim)' : undefined,
                borderLeft: isActive ? '3px solid var(--danger)' : '3px solid transparent',
                borderBottom: '1px solid var(--bd-s)',
              }}
            >
              <span
                className="mono text-[length:var(--text-label)] font-bold w-9 shrink-0"
                style={{ color: isActive ? 'var(--danger)' : 'var(--t2)' }}
              >
                {dayLabel(day, allDays)}
              </span>

              <div className="flex-1 min-w-0">
                <span
                  className="mono text-[length:var(--text-caption)] block"
                  style={{ color: isActive ? 'var(--danger)' : 'var(--t3)' }}
                >
                  {day}
                </span>
                <span
                  className="mono text-[length:var(--text-micro)]"
                  style={{ color: isActive ? 'var(--danger)' : 'var(--t4)' }}
                >
                  {ec} events
                </span>
              </div>

              {snap && (
                <div className="shrink-0 flex flex-col items-end gap-px">
                  <span
                    className="mono text-[length:var(--text-caption)] font-bold"
                    style={{
                      color: snap.escalation >= 90 ? 'var(--danger)'
                        : snap.escalation >= 80 ? 'var(--warning)' : 'var(--t3)',
                    }}
                  >
                    {snap.escalation}
                  </span>
                  <div className="w-7 h-[3px] bg-[var(--bg-3)] overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${snap.escalation}%`,
                        background: snap.escalation >= 90 ? 'var(--danger)'
                          : snap.escalation >= 80 ? 'var(--warning)' : 'var(--info)',
                      }}
                    />
                  </div>
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </PopoverContent>
  );
}
