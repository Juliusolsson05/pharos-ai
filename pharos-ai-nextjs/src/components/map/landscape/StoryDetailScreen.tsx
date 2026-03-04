'use client';

import { MapPin } from 'lucide-react';
import { LandscapeHeader } from './LandscapeHeader';
import { fmtTimeZ } from '@/lib/format';
import type { MapStory } from '@/types/domain';

type Props = {
  story: MapStory;
  onBack: () => void;
  onSeeOnMap: (story: MapStory) => void;
};

const CAT_COLOR: Record<string, string> = {
  STRIKE:      'var(--danger)',
  RETALIATION: 'var(--warning)',
  NAVAL:       'var(--blue)',
  INTEL:       'var(--cyber)',
  DIPLOMATIC:  'var(--teal)',
};

export function StoryDetailScreen({ story, onBack, onSeeOnMap }: Props) {
  const catColor = CAT_COLOR[story.category] ?? 'var(--t3)';

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-app)] overflow-hidden">
      <LandscapeHeader
        title="STORIES"
        onBack={onBack}
        right={
          <button
            onClick={() => onSeeOnMap(story)}
            className="flex items-center gap-1.5 px-2 py-1 border border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)] hover:bg-[var(--blue)] hover:text-white transition-colors"
          >
            <MapPin size={11} strokeWidth={2} />
            <span className="mono text-[9px] font-bold tracking-[0.06em]">SEE ON MAP</span>
          </button>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Hero */}
        <div className="px-4 py-3 border-b border-[var(--bd)] bg-[var(--bg-2)]">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="mono text-[8px] font-bold tracking-[0.08em] px-[5px] py-[1px]"
              style={{ color: catColor, background: catColor + '18', border: `1px solid ${catColor}40` }}
            >
              {story.category}
            </span>
            <span className="mono text-[8px] text-[var(--t4)]">{fmtTimeZ(story.timestamp)}</span>
          </div>
          <h2 className="text-[14px] font-bold text-[var(--t1)] leading-snug mb-1">{story.title}</h2>
          <p className="text-[11px] text-[var(--t3)] leading-snug">{story.tagline}</p>
        </div>

        {/* Narrative */}
        <div className="px-4 py-3 border-b border-[var(--bd)]">
          <div className="label text-[8px] text-[var(--t4)] mb-2 tracking-[0.10em]">NARRATIVE</div>
          <p className="text-[12px] text-[var(--t2)] leading-relaxed whitespace-pre-line">{story.narrative}</p>
        </div>

        {/* Key Facts */}
        {story.keyFacts.length > 0 && (
          <div className="px-4 py-3 border-b border-[var(--bd)]">
            <div className="label text-[8px] text-[var(--t4)] mb-2 tracking-[0.10em]">KEY FACTS</div>
            {story.keyFacts.map((fact, i) => (
              <div key={i} className="flex gap-2 items-start py-1.5" style={{ borderBottom: i < story.keyFacts.length - 1 ? '1px solid var(--bd-s)' : 'none' }}>
                <span className="mono text-[9px] text-[var(--blue)] shrink-0 mt-[1px]">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[11px] text-[var(--t2)] leading-snug">{fact}</p>
              </div>
            ))}
          </div>
        )}

        {/* Events timeline */}
        {story.events.length > 0 && (
          <div className="px-4 py-3">
            <div className="label text-[8px] text-[var(--t4)] mb-2 tracking-[0.10em]">EVENTS ({story.events.length})</div>
            {story.events.map((evt, i) => (
              <div
                key={i}
                className="flex gap-2 items-start py-1.5"
                style={{ borderBottom: i < story.events.length - 1 ? '1px solid var(--bd-s)' : 'none', borderLeft: `2px solid ${catColor}`, paddingLeft: 8 }}
              >
                <span className="mono text-[8px] text-[var(--t4)] shrink-0 w-12">{fmtTimeZ(evt.time)}</span>
                <p className="text-[11px] text-[var(--t2)] leading-snug">{evt.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
