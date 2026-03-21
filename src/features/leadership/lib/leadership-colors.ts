export const LEADERSHIP_TIER_COLORS: Record<number, string> = {
  0: 'color-mix(in srgb, var(--blue) 72%, black)',
  1: 'var(--info)',
  2: 'var(--teal)',
  3: 'var(--cyber)',
  4: 'var(--warning)',
  5: 'var(--t2)',
};

export function getLeadershipTierColor(level: number): string {
  return LEADERSHIP_TIER_COLORS[level] ?? 'var(--t3)';
}

export function getLeadershipHeaderColor(level: number, status: 'ALIVE' | 'DEAD' | 'UNKNOWN' | 'VACANT'): string {
  if (status === 'DEAD') return 'color-mix(in srgb, var(--danger) 82%, black)';
  return getLeadershipTierColor(level);
}
