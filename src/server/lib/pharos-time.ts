export type DayPhase = 'overnight' | 'morning' | 'midday' | 'evening' | 'late';

type TimezoneLike = {
  timezone?: string | null;
};

export function getConflictTimezone(conflict?: TimezoneLike | null): string {
  return conflict?.timezone || 'Europe/Stockholm';
}

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: map.weekday,
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asIfUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asIfUtc - date.getTime();
}

export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffsetMs(guess, timeZone);
  return new Date(guess.getTime() - offset);
}

export function conflictDayStringToDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function getConflictLocalNow(timeZone: string, now = new Date()) {
  const parts = getZonedParts(now, timeZone);
  const today = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;

  let phase: DayPhase;
  if (parts.hour < 6) phase = 'overnight';
  else if (parts.hour < 11) phase = 'morning';
  else if (parts.hour < 16) phase = 'midday';
  else if (parts.hour < 21) phase = 'evening';
  else phase = 'late';

  return {
    today,
    localHour: parts.hour,
    localMinute: parts.minute,
    weekday: parts.weekday,
    phase,
    label: `${today} ${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')} ${timeZone}`,
  };
}

export function getConflictDayRange(timeZone: string, now = new Date()) {
  const parts = getZonedParts(now, timeZone);
  const today = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;

  return {
    today,
    dayDate: conflictDayStringToDate(today),
    start: zonedDateTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, timeZone),
    end: zonedDateTimeToUtc(parts.year, parts.month, parts.day + 1, 0, 0, 0, timeZone),
  };
}

export function toConflictLocalDateString(date: Date | string, timeZone: string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const parts = getZonedParts(value, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}
