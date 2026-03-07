import { useRef, useState, useCallback, useEffect } from 'react';

type DragHandle = 'left' | 'right' | 'range';

type UseTimelineDragReturn = {
  trackRef:        React.RefObject<HTMLDivElement | null>;
  dragging:        DragHandle | null;
  handleMouseDown: (e: React.MouseEvent | React.TouchEvent, handle: DragHandle) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleClick:     (e: React.MouseEvent) => void;
};

export function useTimelineDrag(
  viewExtent: [number, number],
  timeRange:  [number, number] | null,
  onTimeRange: (range: [number, number] | null) => void,
): UseTimelineDragReturn {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragHandle | null>(null);
  const dragRef = useRef<{ startX: number; startRange: [number, number] } | null>(null);
  const didDragRef = useRef(false);

  // Use refs for values accessed during drag to avoid stale closures
  const viewExtentRef = useRef(viewExtent);
  const timeRangeRef = useRef(timeRange);
  const onTimeRangeRef = useRef(onTimeRange);

  useEffect(() => {
    viewExtentRef.current = viewExtent;
    timeRangeRef.current = timeRange;
    onTimeRangeRef.current = onTimeRange;
  }, [viewExtent, timeRange, onTimeRange]);

  const toMs = useCallback((clientX: number) => {
    if (!trackRef.current) return viewExtentRef.current[0];
    const rect = trackRef.current.getBoundingClientRect();
    const [min, max] = viewExtentRef.current;
    const s = max - min;
    return min + (Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * s);
  }, []);

  const getClientX = useCallback((e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) return e.touches[0].clientX;
    if ('changedTouches' in e && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
    return (e as MouseEvent).clientX;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent, handle: DragHandle) => {
    e.preventDefault(); e.stopPropagation();
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const currentRng = timeRangeRef.current ?? viewExtentRef.current;
    setDragging(handle);
    dragRef.current = { startX: clientX, startRange: [currentRng[0], currentRng[1]] };
    didDragRef.current = false;
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) e.preventDefault();
      didDragRef.current = true;
      const ms = toMs(getClientX(e));
      const currentRng = timeRangeRef.current ?? viewExtentRef.current;
      const [min, max] = viewExtentRef.current;
      const s = max - min;

      if (dragging === 'left') {
        onTimeRangeRef.current([Math.min(ms, currentRng[1] - s * 0.005), currentRng[1]]);
      } else if (dragging === 'right') {
        onTimeRangeRef.current([currentRng[0], Math.max(ms, currentRng[0] + s * 0.005)]);
      } else if (dragging === 'range' && dragRef.current && trackRef.current) {
        const dMs = ((getClientX(e) - dragRef.current.startX) / trackRef.current.getBoundingClientRect().width) * s;
        let nL = dragRef.current.startRange[0] + dMs, nR = dragRef.current.startRange[1] + dMs;
        if (nL < min) { nR += min - nL; nL = min; }
        if (nR > max) { nL -= nR - max; nR = max; }
        onTimeRangeRef.current([nL, nR]);
      }
    };
    const up = () => setDragging(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, getClientX, toMs]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didDragRef.current) { didDragRef.current = false; return; }
    const ms = toMs(e.clientX);
    const [min, max] = viewExtentRef.current;
    const s = max - min;
    const w = s * 0.12;
    onTimeRangeRef.current([Math.max(min, ms - w / 2), Math.min(max, ms + w / 2)]);
  }, [toMs]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (dragging) return;
    const clientX = e.touches[0]?.clientX;
    if (clientX === undefined) return;
    const ms = toMs(clientX);
    const [min, max] = viewExtentRef.current;
    const s = max - min;
    const w = s * 0.12;
    onTimeRangeRef.current([Math.max(min, ms - w / 2), Math.min(max, ms + w / 2)]);
  }, [dragging, toMs]);

  return { trackRef, dragging, handleMouseDown, handleTouchStart, handleClick };
}
