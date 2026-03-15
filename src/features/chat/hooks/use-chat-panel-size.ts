'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useIsMobile } from '@/shared/hooks/use-is-mobile';

const DEFAULT_SIZE = { width: 380, height: 520 };
const MIN_SIZE = { width: 320, height: 360 };

type DragState = {
  startHeight: number;
  startWidth: number;
  startX: number;
  startY: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useChatPanelSize() {
  const isMobile = useIsMobile(768);
  const dragRef = useRef<DragState | null>(null);
  const [size, setSize] = useState(DEFAULT_SIZE);

  useEffect(() => {
    if (isMobile) return;

    const syncViewport = () => {
      setSize(current => ({
        width: clamp(current.width, MIN_SIZE.width, Math.max(MIN_SIZE.width, window.innerWidth - 20)),
        height: clamp(current.height, MIN_SIZE.height, Math.max(MIN_SIZE.height, window.innerHeight - 24)),
      }));
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, [isMobile]);

  const stopResize = useCallback(() => {
    dragRef.current = null;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const maxWidth = Math.max(MIN_SIZE.width, window.innerWidth - 20);
      const maxHeight = Math.max(MIN_SIZE.height, window.innerHeight - 24);
      setSize({
        width: clamp(drag.startWidth - (event.clientX - drag.startX), MIN_SIZE.width, maxWidth),
        height: clamp(drag.startHeight - (event.clientY - drag.startY), MIN_SIZE.height, maxHeight),
      });
    };

    const onUp = () => stopResize();

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isMobile, stopResize]);

  const startResize = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (isMobile) return;

    event.preventDefault();
    dragRef.current = {
      startHeight: size.height,
      startWidth: size.width,
      startX: event.clientX,
      startY: event.clientY,
    };
    document.body.style.userSelect = 'none';
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [isMobile, size.height, size.width]);

  return { isMobile, size, startResize };
}
