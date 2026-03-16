'use client';

import { useCallback, useEffect, useRef } from 'react';

type WindowPosition = {
  x: number;
  y: number;
};

type WindowSize = {
  width: number;
  height: number;
};

type DragState = {
  startX: number;
  startY: number;
  x: number;
  y: number;
};

type ResizeState = {
  startHeight: number;
  startWidth: number;
  startX: number;
  startY: number;
};

const MIN_HEIGHT = 220;
const MIN_WIDTH = 320;
const VIEWPORT_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampPosition(position: WindowPosition, size: WindowSize) {
  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - size.width - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - size.height - VIEWPORT_MARGIN);

  return {
    x: clamp(position.x, VIEWPORT_MARGIN, maxX),
    y: clamp(position.y, VIEWPORT_MARGIN, maxY),
  };
}

function clampSize(size: WindowSize) {
  return {
    width: clamp(size.width, MIN_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2)),
    height: clamp(size.height, MIN_HEIGHT, Math.max(MIN_HEIGHT, window.innerHeight - VIEWPORT_MARGIN * 2)),
  };
}

type Props = {
  enabled: boolean;
  position: WindowPosition;
  setPosition: (position: WindowPosition) => void;
  setSize: (size: WindowSize) => void;
  size: WindowSize;
};

export function useFloatingChannelWindowLayout({ enabled, position, setPosition, setSize, size }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const latestPositionRef = useRef(position);
  const latestSizeRef = useRef(size);
  const resizeRef = useRef<ResizeState | null>(null);

  useEffect(() => {
    latestPositionRef.current = position;
  }, [position]);

  useEffect(() => {
    latestSizeRef.current = size;
  }, [size]);

  const stopInteraction = useCallback(() => {
    dragRef.current = null;
    resizeRef.current = null;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const syncViewport = () => {
      const nextSize = clampSize(latestSizeRef.current);
      const nextPosition = clampPosition(latestPositionRef.current, nextSize);

      if (
        nextSize.width !== latestSizeRef.current.width
        || nextSize.height !== latestSizeRef.current.height
      ) {
        latestSizeRef.current = nextSize;
        setSize(nextSize);
      }

      if (
        nextPosition.x !== latestPositionRef.current.x
        || nextPosition.y !== latestPositionRef.current.y
      ) {
        latestPositionRef.current = nextPosition;
        setPosition(nextPosition);
      }
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, [enabled, setPosition, setSize]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (drag) {
        const currentSize = latestSizeRef.current;
        setPosition(clampPosition({
          x: drag.x + event.clientX - drag.startX,
          y: drag.y + event.clientY - drag.startY,
        }, currentSize));
        return;
      }

      const resize = resizeRef.current;
      if (!resize) return;

      const nextSize = clampSize({
        width: resize.startWidth - (event.clientX - resize.startX),
        height: resize.startHeight - (event.clientY - resize.startY),
      });
      latestSizeRef.current = nextSize;
      setSize(nextSize);
      const nextPosition = clampPosition(latestPositionRef.current, nextSize);
      latestPositionRef.current = nextPosition;
      setPosition(nextPosition);
    };

    const onUp = () => stopInteraction();

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [enabled, setPosition, setSize, stopInteraction]);

  const startDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;

    event.preventDefault();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      x: position.x,
      y: position.y,
    };
    document.body.style.userSelect = 'none';
  }, [enabled, position.x, position.y]);

  const startResize = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!enabled) return;

    event.preventDefault();
    resizeRef.current = {
      startHeight: size.height,
      startWidth: size.width,
      startX: event.clientX,
      startY: event.clientY,
    };
    document.body.style.userSelect = 'none';
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [enabled, size.height, size.width]);

  return { startDrag, startResize };
}
