'use client';

import { LandscapeHeader } from './LandscapeHeader';
import { StrikeContent, MissileContent, TargetContent, AssetContent, ZoneContent } from '@/components/map/MapDetailContent';
import type { SelectedItem } from '@/components/map/MapDetailPanel';
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
  item: SelectedItem;
  onBack: () => void;
  onSelectItem: (item: SelectedItem) => void;
  onActivateStory: (story: MapStory) => void;
};

export function EventDetailScreen({ item, onBack, onSelectItem, onActivateStory }: Props) {
  const accent = PANEL_ACCENT[item.type];

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-app)] overflow-hidden">
      <LandscapeHeader title="MAP" onBack={onBack} />

      {/* Type header */}
      <div className="shrink-0 px-4 py-2 border-b border-[var(--bd)] bg-[var(--bg-2)]" style={{ borderTop: `2px solid ${accent}` }}>
        <p className="label text-[8px] mb-0.5" style={{ color: accent }}>{PANEL_LABEL[item.type]}</p>
        <p className="mono text-[13px] font-bold text-[var(--t1)]">{getTitle(item)}</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        {item.type === 'strike'  && <StrikeContent  d={item.data} onSelectItem={onSelectItem} onActivateStory={onActivateStory} />}
        {item.type === 'missile' && <MissileContent d={item.data} onActivateStory={onActivateStory} />}
        {item.type === 'target'  && <TargetContent  d={item.data} onSelectItem={onSelectItem} onActivateStory={onActivateStory} />}
        {item.type === 'asset'   && <AssetContent   d={item.data} onActivateStory={onActivateStory} />}
        {item.type === 'zone'    && <ZoneContent    d={item.data} />}
      </div>

      {/* Footer */}
      <div className="shrink-0 h-8 flex items-center px-4 border-t border-[var(--bd-s)] bg-[var(--bg-app)]">
        <span className="mono text-[8px] text-[var(--t4)]">PHAROS INTEL · UNCLASSIFIED</span>
      </div>
    </div>
  );
}
