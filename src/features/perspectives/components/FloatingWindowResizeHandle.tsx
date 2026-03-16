'use client';

import { MoveDiagonal2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
};

export function FloatingWindowResizeHandle({ onPointerDown }: Props) {
  return (
    <Button
      aria-label="Resize live window"
      className="absolute left-1 top-1 h-5 w-5 cursor-nwse-resize rounded border border-[var(--bd)] bg-[var(--bg-app)] p-0 text-[var(--t4)] hover:bg-[var(--bg-3)]"
      onPointerDown={onPointerDown}
      size="icon-xs"
      variant="ghost"
    >
      <MoveDiagonal2 size={11} />
    </Button>
  );
}
