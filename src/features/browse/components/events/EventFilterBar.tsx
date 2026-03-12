'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const SEV_FILTERS = [
  { key: 'CRITICAL', color: 'var(--danger)' },
  { key: 'HIGH', color: 'var(--warning)' },
  { key: 'STANDARD', color: 'var(--info)' },
] as const;

type Props = {
  eventDates: string[];
};

export function EventFilterBar({ eventDates }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventDateSet = new Set(eventDates);
  const activeSev = new Set(searchParams.getAll('severity'));
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam ? new Date(dateParam + 'T12:00:00') : undefined;

  function updateParams(updates: Record<string, string | string[] | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      params.delete(key);
      if (value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v);
      } else {
        params.set(key, value);
      }
    }

    const qs = params.toString();
    router.push(qs ? `?${qs}` : '/browse/events', { scroll: false });
  }

  function handleToggleSeverity(sev: string) {
    const next = new Set(activeSev);
    if (next.has(sev)) next.delete(sev);
    else next.add(sev);
    updateParams({ severity: next.size > 0 ? [...next] : null });
  }

  function handlePickDate(day: Date | undefined) {
    if (!day) {
      updateParams({ date: null });
      return;
    }
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    updateParams({ date: `${y}-${m}-${d}` });
  }

  const hasFilters = activeSev.size > 0 || dateParam;

  return (
    <div className="flex items-center gap-3">
      {SEV_FILTERS.map(({ key, color }) => {
        const active = activeSev.has(key);
        const hasAnySev = activeSev.size > 0;
        return (
          <Button
            key={key}
            variant="ghost"
            size="icon-xs"
            onClick={() => handleToggleSeverity(key)}
            className="size-3 rounded-full shrink-0 p-0"
            style={{
              background: color,
              boxShadow: active ? `0 0 6px ${color}` : 'none',
              opacity: hasAnySev && !active ? 0.3 : 1,
            }}
            aria-label={`Filter ${key.toLowerCase()}`}
          />
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="xs"
            className="mono text-[10px] text-[var(--t4)] hover:text-[var(--t2)]"
            aria-label="Pick date"
          >
            <CalendarIcon className="size-3" />
            {dateParam ?? 'Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" data-theme="auto" className="w-auto p-0 bg-[var(--bg-1)] border-[var(--bd)] text-[var(--foreground)]">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handlePickDate}
            defaultMonth={selectedDate}
            disabled={(d) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return !eventDateSet.has(`${y}-${m}-${day}`);
            }}
          />
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => updateParams({ severity: null, date: null })}
          className="mono text-[10px] text-[var(--t4)] hover:text-[var(--t2)]"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
