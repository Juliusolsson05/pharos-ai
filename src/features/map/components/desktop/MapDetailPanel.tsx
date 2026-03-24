'use client';

import { Button } from '@/components/ui/button';

import { AssetContent, MissileContent, StrikeContent, TargetContent, ZoneContent } from '@/features/map/components/MapDetailContent';
import type { SelectedItem } from '@/features/map/components/types';

import type { MapStory } from '@/types/domain';

const PANEL_LABEL: Record<SelectedItem['type'], string> = {
  strike:  'STRIKE TRACK',
  missile: 'MISSILE TRACK',
  target:  'TARGET SITE',
  asset:   'ALLIED ASSET',
  zone:    'THREAT ZONE',
};

const PANEL_ACCENT: Record<SelectedItem['type'], string> = {
  strike:  'var(--blue)',
  missile: 'var(--danger)',
  target:  'var(--warning)',
  asset:   'var(--teal)',
  zone:    'var(--warning)',
};

function getTitle(item: SelectedItem): string {
  return 'label' in item.data ? item.data.label : item.data.name;
}

type Props = {
  item:            SelectedItem | null;
  onClose:         () => void;
  onSelectItem:    (item: SelectedItem) => void;
  onActivateStory: (story: MapStory) => void;
};

/**
 * Absolute-positioned right-side detail panel for desktop.
 * Slides in/out via transform.
 */
export function DesktopDetailPanel({ item, onClose, onSelectItem, onActivateStory }: Props) {
  return (
    <div style={{
      position:      'absolute',
      top:           0,
      right:         0,
      bottom:        0,
      width:         320,
      background:    'var(--bg-app)',
      borderLeft:    '1px solid var(--bd)',
      display:       'flex',
      flexDirection: 'column',
      transform:     item ? 'translateX(0)' : 'translateX(100%)',
      transition:    'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
      zIndex:        20,
      pointerEvents: item ? 'auto' : 'none',
    }}>
      {item && (
        <>
          {/* Header */}
          <div className="panel-header" style={{ borderTop: `2px solid ${PANEL_ACCENT[item.type]}`, height: 44, minHeight: 44 }}>
            <div className="flex-1 min-w-0">
              <p className="label" style={{ color: PANEL_ACCENT[item.type], marginBottom: 2 }}>
                {PANEL_LABEL[item.type]}
              </p>
              <p className="mono" style={{ color: 'var(--t1)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getTitle(item)}
              </p>
            </div>
            <Button variant="ghost" size="xs" onClick={onClose}
              className="h-5 w-5 p-0 text-[var(--t4)] hover:text-[var(--t2)] text-base leading-none shrink-0"
            >✕</Button>
          </div>

          {/* Body */}
          <div className="panel-body" style={{ padding: '14px 16px' }}>
            {item.type === 'strike'  && <StrikeContent  d={item.data} onSelectItem={onSelectItem} onActivateStory={onActivateStory} />}
            {item.type === 'missile' && <MissileContent d={item.data} onActivateStory={onActivateStory} />}
            {item.type === 'target'  && <TargetContent  d={item.data} onSelectItem={onSelectItem} onActivateStory={onActivateStory} />}
            {item.type === 'asset'   && <AssetContent   d={item.data} onActivateStory={onActivateStory} />}
            {item.type === 'zone'    && <ZoneContent    d={item.data} />}
          </div>

          {/* Footer */}
          <div style={{ height: 36, borderTop: '1px solid var(--bd-s)', display: 'flex', alignItems: 'center', padding: '0 14px', flexShrink: 0 }}>
            <span className="mono" style={{ fontSize: 'var(--text-caption)', color: 'var(--t4)' }}>PHAROS INTEL · UNCLASSIFIED</span>
          </div>
        </>
      )}
    </div>
  );
}
