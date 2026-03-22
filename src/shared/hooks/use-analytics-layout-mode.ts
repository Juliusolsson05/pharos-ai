'use client';

import { getAnalyticsLayoutMode } from '@/shared/lib/analytics';

import { useIsLandscapePhone } from './use-is-landscape-phone';
import { useIsMobile } from './use-is-mobile';

export function useAnalyticsLayoutMode() {
  const isLandscapePhone = useIsLandscapePhone();
  const isMobile = useIsMobile(1024);

  return getAnalyticsLayoutMode({ isLandscapePhone, isMobile });
}
