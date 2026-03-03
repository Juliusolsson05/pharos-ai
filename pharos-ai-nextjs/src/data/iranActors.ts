import type { ActivityLevel, Stance } from '@/types/domain';

export const ACT_C: Record<ActivityLevel, string> = {
  CRITICAL: 'var(--danger)',
  HIGH:     'var(--warning)',
  ELEVATED: 'var(--info)',
  MODERATE: 'var(--t2)',
};

export const STA_C: Record<Stance, string> = {
  AGGRESSOR:   'var(--danger)',
  DEFENDER:    'var(--info)',
  RETALIATING: 'var(--warning)',
  PROXY:       'var(--warning)',
  NEUTRAL:     'var(--t3)',
  CONDEMNING:  'var(--t2)',
};
