'use client';

import { useEffect, useRef, useState } from 'react';
import { LANDSCAPE_SCROLL_EVENT } from '@/shared/hooks/use-landscape-scroll-emitter';

const UP_THRESHOLD = 22;
const DOWN_THRESHOLD = 14;

export function useLandscapeHeaderVisibility(enabled: boolean, resetKey: string): boolean {
  const [visible, setVisible] = useState(!enabled);
  const lastTopRef = useRef(0);
  const upAccumRef = useRef(0);
  const downAccumRef = useRef(0);

  useEffect(() => {
    lastTopRef.current = 0;
    upAccumRef.current = 0;
    downAccumRef.current = 0;

    if (!enabled) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }

    const initTimer = setTimeout(() => setVisible(false), 0);

    const onScroll = (event: Event) => {
      const custom = event as CustomEvent<{ scrollTop?: number }>;
      const top = Math.max(0, custom.detail?.scrollTop ?? 0);
      const delta = top - lastTopRef.current;
      lastTopRef.current = top;

      if (delta < -1) {
        upAccumRef.current += -delta;
        downAccumRef.current = 0;
        if (upAccumRef.current >= UP_THRESHOLD) {
          setVisible(true);
          upAccumRef.current = 0;
        }
      } else if (delta > 1) {
        downAccumRef.current += delta;
        upAccumRef.current = 0;
        if (downAccumRef.current >= DOWN_THRESHOLD) {
          setVisible(false);
          downAccumRef.current = 0;
        }
      }
    };

    window.addEventListener(LANDSCAPE_SCROLL_EVENT, onScroll as EventListener);
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener(LANDSCAPE_SCROLL_EVENT, onScroll as EventListener);
    };
  }, [enabled, resetKey]);

  return visible;
}
