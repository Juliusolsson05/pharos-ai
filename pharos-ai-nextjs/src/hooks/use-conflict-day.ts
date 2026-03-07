'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { dayLabel, dayShort, dayIndex } from '@/shared/lib/day-filter';
import { useBootstrap } from '@/features/dashboard/queries';

export function useConflictDay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: bootstrap } = useBootstrap();

  const allDays = bootstrap?.days ?? [];
  const raw = searchParams.get('day');
  const currentDay: string = raw && allDays.includes(raw)
    ? raw
    : allDays[allDays.length - 1] ?? '';

  const setDay = useCallback((day: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('day', day);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  return {
    currentDay,
    setDay,
    dayLabel: currentDay ? dayLabel(currentDay, allDays) : '',
    dayShort: currentDay ? dayShort(currentDay) : '',
    dayIndex: currentDay ? dayIndex(currentDay, allDays) : -1,
    allDays,
    isLoading: !bootstrap,
  };
}
