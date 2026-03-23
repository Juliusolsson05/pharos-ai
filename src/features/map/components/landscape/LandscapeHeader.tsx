'use client';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
};

export function LandscapeHeader({ title, onBack, right }: Props) {
  return (
    <div
      className="shrink-0 flex items-center gap-2 h-9 px-2 bg-[var(--bg-app)] border-b border-[var(--bd)]"
      style={{ paddingLeft: 'max(8px, env(safe-area-inset-left))', paddingRight: 'max(8px, env(safe-area-inset-right))' }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="flex items-center gap-1.5 px-2 py-1 text-[var(--t3)] hover:text-[var(--t1)] transition-colors rounded-none"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        <span className="mono text-[length:var(--text-label)] font-bold tracking-[0.06em]">{title}</span>
      </Button>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
