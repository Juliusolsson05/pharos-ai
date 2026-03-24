'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

type LegendItem = { shape: 'rect' | 'circle' | 'zone'; color: string; label: string };

const ITEMS: LegendItem[] = [
  { shape: 'rect',   color: 'var(--blue)',    label: 'US STRIKE TRACK'    },
  { shape: 'rect',   color: 'var(--teal)',    label: 'IDF STRIKE TRACK'   },
  { shape: 'rect',   color: 'var(--teal)',    label: 'NAVAL STRIKE'       },
  { shape: 'rect',   color: 'var(--danger)',  label: 'HOSTILE MISSILE'    },
  { shape: 'rect',   color: 'var(--warning)', label: 'INTERCEPTED'        },
  { shape: 'circle', color: 'var(--danger)',  label: 'DESTROYED TARGET'   },
  { shape: 'circle', color: 'var(--warning)', label: 'DAMAGED TARGET'     },
  { shape: 'circle', color: 'var(--success)', label: 'ACTIVE / TARGETED'  },
  { shape: 'circle', color: 'var(--blue)',    label: 'US ASSET'           },
  { shape: 'circle', color: 'var(--teal)',    label: 'IDF ASSET'          },
  { shape: 'circle', color: 'var(--cyber)',   label: 'NATO ASSET'         },
  { shape: 'zone',   color: 'var(--danger)',  label: 'CLOSURE ZONE'       },
  { shape: 'zone',   color: 'var(--warning)', label: 'PATROL / NFZ'       },
];

type Props = { hasPanel: boolean; timelineVisible?: boolean; isMobile?: boolean };

export function MapLegend({ hasPanel, timelineVisible = true, isMobile = false }: Props) {
  const bottom = isMobile
    ? (timelineVisible ? 'calc(126px + var(--safe-bottom))' : 'calc(12px + var(--safe-bottom))')
    : (timelineVisible ? 56 : 12);
  const left: number | string = isMobile ? 'max(12px, var(--safe-left))' : 12;
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div style={{
      position:      'absolute',
      bottom,
      left,
      background:    'rgba(28,33,39,0.92)',
      border:        '1px solid var(--bd)',
      borderRadius:  2,
      padding:       isCollapsed ? '0' : '10px 12px',
      transition:    'opacity 0.2s',
      opacity:       hasPanel ? 0.4 : 1,
      zIndex:        22,
    }}>
      <Button
        variant="ghost"
        onClick={() => setIsCollapsed(v => !v)}
        className="label w-full justify-start h-auto text-[var(--t4)]"
        style={{
          padding:     isCollapsed ? '6px 10px' : '0 0 6px 0',
          fontSize: 'var(--text-caption)',
          fontWeight:  700,
          letterSpacing: '0.06em',
        }}
      >
        LEGEND {isCollapsed ? '▸' : '▾'}
      </Button>

      {!isCollapsed && ITEMS.map(({ shape, color, label }) => (
        <div key={label} className="flex items-center gap-1.5" style={{ marginBottom: 3, fontSize: 'var(--text-caption)', color: 'var(--t3)' }}>
          {shape === 'rect'   && <div style={{ width: 12, height: 3,  background: color, flexShrink: 0 }} />}
          {shape === 'circle' && <div style={{ width: 8,  height: 8,  borderRadius: '50%', background: color, flexShrink: 0 }} />}
          {shape === 'zone'   && <div style={{ width: 10, height: 8,  background: `color-mix(in srgb, ${color} 30%, transparent)`, border: `1px solid ${color}`, flexShrink: 0 }} />}
          {label}
        </div>
      ))}
    </div>
  );
}
