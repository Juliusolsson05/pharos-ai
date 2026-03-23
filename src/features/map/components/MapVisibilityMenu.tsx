'use client';

import { useEffect, useRef, useState } from 'react';

import { Eye, EyeOff,Layers } from 'lucide-react';

import { Button } from '@/components/ui/button';

export type OverlayVisibility = {
  timeline: boolean;
  filters:  boolean;
  legend:   boolean;
};

type Props = {
  visibility: OverlayVisibility;
  onToggle:   (key: keyof OverlayVisibility) => void;
  direction?: 'up' | 'down';
};

const LABELS: { key: keyof OverlayVisibility; label: string }[] = [
  { key: 'timeline', label: 'TIMELINE' },
  { key: 'filters',  label: 'FILTERS'  },
  { key: 'legend',   label: 'LEGEND'   },
];

export function MapVisibilityMenu({ visibility, onToggle, direction = 'up' }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!menuRef.current?.contains(target)) setOpen(false);
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(v => !v)}
        className="mono h-7 w-7 p-0"
        style={{
          background:   'rgba(28,33,39,0.92)',
          border:       '1px solid var(--bd)',
          borderRadius: 2,
          color:        'var(--t3)',
        }}
        title="Toggle overlays"
      >
        <Layers size={14} strokeWidth={2} />
      </Button>

      {open && (
        <div style={{
          position:     'absolute',
          right:        0,
          ...(direction === 'up'
            ? { bottom: '100%', marginBottom: 4 }
            : { top: '100%', marginTop: 4 }),
          background:   'rgba(28,33,39,0.95)',
          border:       '1px solid var(--bd)',
          borderRadius: 2,
          padding:      '6px 0',
          minWidth:     140,
          zIndex:       20,
        }}>
          {LABELS.map(({ key, label }) => {
            const visible = visibility[key];
            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => onToggle(key)}
                className="mono flex items-center gap-2 w-full justify-start h-auto rounded-none"
                style={{
                  padding:   '5px 12px',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 700,
                  color:     visible ? 'var(--t2)' : 'var(--t4)',
                  background: 'transparent',
                  letterSpacing: '0.06em',
                }}
              >
                {visible
                  ? <Eye size={12} strokeWidth={2} />
                  : <EyeOff size={12} strokeWidth={2} />}
                {label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
