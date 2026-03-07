'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { fmtDate, fmtTimeZ } from '@/shared/lib/format';
import StoryIcon from './StoryIcon';
import { useMapData } from '@/features/map/queries';

import type { StrikeArc, MissileTrack, Target, Asset } from '@/data/map-data';
import type { MapStory, StoryEvent } from '@/types/domain';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<MapStory['category'], { bg: string; text: string }> = {
  STRIKE:      { bg: 'var(--danger-dim)',  text: 'var(--danger)'  },
  RETALIATION: { bg: 'var(--danger-dim)',  text: 'var(--danger)'  },
  NAVAL:       { bg: 'var(--info-dim)',    text: 'var(--blue-l)'  },
  INTEL:       { bg: 'rgba(160,100,220,0.12)', text: 'var(--cyber)' },
  DIPLOMATIC:  { bg: 'var(--success-dim)', text: 'var(--success)' },
};

const EVENT_COLORS: Record<StoryEvent['type'], string> = {
  STRIKE:      'var(--danger)',
  RETALIATION: 'var(--warning)',
  INTEL:       'var(--cyber)',
  NAVAL:       'var(--blue-l)',
  POLITICAL:   'var(--t3)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventLog({ events }: { events: StoryEvent[] }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p className="label" style={{ color: 'var(--t4)', marginBottom: 8 }}>EVENT LOG</p>
      <div style={{ position: 'relative', paddingLeft: 16 }}>
        <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 1, background: 'var(--bd-s)' }} />
        {events.map((ev, i) => {
          const color = EVENT_COLORS[ev.type] ?? 'var(--t3)';
          return (
            <div key={i} style={{ position: 'relative', marginBottom: i < events.length - 1 ? 10 : 0 }}>
              <div style={{
                position: 'absolute', left: -12, top: 4,
                width: 7, height: 7, borderRadius: '50%',
                background: color, border: `1px solid ${color}`,
              }} />
              <p className="mono" style={{ fontSize: 9, color, fontWeight: 700, marginBottom: 1 }}>
                {new Date(ev.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase()} · {fmtTimeZ(ev.time)}
              </p>
              <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>{ev.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Story map features ───────────────────────────────────────────────────────

type FeatureItem =
  | { kind: 'strike';  data: StrikeArc   }
  | { kind: 'missile'; data: MissileTrack }
  | { kind: 'target';  data: Target      }
  | { kind: 'asset';   data: Asset       };

const FEATURE_COLOR: Record<FeatureItem['kind'], string> = {
  strike:  'var(--blue)',
  missile: 'var(--danger)',
  target:  'var(--warning)',
  asset:   'var(--teal)',
};
const FEATURE_ICON: Record<FeatureItem['kind'], string> = {
  strike:  '⟶',
  missile: '⌖',
  target:  '◎',
  asset:   '▲',
};

function StoryFeatures({ story }: { story: MapStory }) {
  const { data } = useMapData();

  const features = useMemo((): FeatureItem[] => {
    if (!data) return [];
    const out: FeatureItem[] = [];
    for (const id of story.highlightStrikeIds)  { const d = data.strikes.find(x => x.id === id);  if (d) out.push({ kind: 'strike',  data: d }); }
    for (const id of story.highlightMissileIds) { const d = data.missiles.find(x => x.id === id); if (d) out.push({ kind: 'missile', data: d }); }
    for (const id of story.highlightTargetIds)  { const d = data.targets.find(x => x.id === id);  if (d) out.push({ kind: 'target',  data: d }); }
    for (const id of story.highlightAssetIds)   { const d = data.assets.find(x => x.id === id);   if (d) out.push({ kind: 'asset',   data: d }); }
    // sort by timestamp if available
    out.sort((a, b) => {
      const ta = ('timestamp' in a.data ? a.data.timestamp : '') ?? '';
      const tb = ('timestamp' in b.data ? b.data.timestamp : '') ?? '';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
    return out;
  }, [data, story]);

  if (!features.length) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <p className="label" style={{ color: 'var(--t4)', marginBottom: 8 }}>MAP FEATURES ({features.length})</p>
      <div className="flex flex-col gap-1">
        {features.map((f, i) => {
          const color = FEATURE_COLOR[f.kind];
          const icon  = FEATURE_ICON[f.kind];
          const name  = 'label' in f.data ? f.data.label : f.data.name;
          const ts    = 'timestamp' in f.data ? f.data.timestamp : undefined;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '6px 8px',
              background: `color-mix(in srgb, ${color} 7%, var(--bg-1))`,
              border: `1px solid color-mix(in srgb, ${color} 25%, var(--bd-s))`,
              borderRadius: 2,
            }}>
              <span style={{ color, fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="mono" style={{ fontSize: 8, color, fontWeight: 700 }}>{f.kind.toUpperCase()}</span>
                  {ts && <span className="mono" style={{ fontSize: 8, color: 'var(--blue-l)' }}>{fmtDate(ts)} · {fmtTimeZ(ts)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  story:    MapStory;
  isOpen:   boolean;
  onToggle: () => void;
  onFlyTo:  () => void;
};

export default function StoryCard({ story, isOpen, onToggle, onFlyTo }: Props) {
  const catColor = CATEGORY_COLORS[story.category];
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--bd-s)' }}>

      {/* Header row */}
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full text-left hover:bg-[var(--bg-1)] transition-colors rounded-none h-auto"
        style={{
          padding:    '8px 12px',
          background: isOpen ? 'var(--bg-1)' : 'transparent',
          display:    'block',
        }}
      >
        <div className="flex items-center gap-0">
          <StoryIcon iconName={story.iconName} category={story.category} size={12} boxSize={22} style={{ marginRight: 8, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 600, fontSize: 11, color: 'var(--t1)', lineHeight: 1.3 }} className="line-clamp-1">
              {story.title}
            </p>
            <p style={{ fontSize: 9, color: 'var(--t3)', marginTop: 1 }} className="truncate">{story.tagline}</p>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <span className="mono" style={{
              background: catColor.bg, color: catColor.text,
              fontSize: 7, fontWeight: 700, padding: '2px 4px', borderRadius: 2,
            }}>
              {story.category}
            </span>
            <span style={{ color: 'var(--t4)', fontSize: 11 }}>{isOpen ? '∨' : '›'}</span>
          </div>
        </div>
      </Button>

      {/* Expanded body */}
      {isOpen && (
        <div style={{ background: 'var(--bg-app)', padding: '12px 16px' }}>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>
            {story.narrative}
          </p>

          {story.events.length > 0 && <EventLog events={story.events} />}

          {/* Map features */}
          <StoryFeatures story={story} />

          {/* Key facts */}
          <div style={{ marginBottom: 10 }}>
            <p className="label" style={{ color: 'var(--t4)', marginBottom: 6 }}>KEY FACTS</p>
            {story.keyFacts.map((fact, i) => (
              <p key={i} className="mono" style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 3 }}>
                → {fact}
              </p>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onFlyTo} className="flex-1 font-mono text-[10px] tracking-widest"
              style={{ color: 'var(--blue-l)', borderColor: 'var(--blue)', background: 'var(--blue-dim)' }}
            >
              ⊙ FLY TO
            </Button>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="flex-1 font-mono text-[10px] tracking-widest"
              style={{ color: 'var(--t2)', borderColor: 'var(--bd)', background: 'var(--bg-1)' }}
            >
              ⊞ OPEN
            </Button>
          </div>
        </div>
      )}

      {/* Story detail modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="sm:max-w-2xl max-h-[80vh] overflow-y-auto"
          style={{ background: 'var(--bg-app)', color: 'var(--t1)', borderColor: 'var(--bd)' }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <StoryIcon iconName={story.iconName} category={story.category} size={20} boxSize={36} />
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-sm leading-tight" style={{ color: 'var(--t1)' }}>
                  {story.title}
                </DialogTitle>
                <DialogDescription className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                  {story.tagline}
                </DialogDescription>
              </div>
              <span className="mono shrink-0" style={{
                background: catColor.bg, color: catColor.text,
                fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 3,
              }}>
                {story.category}
              </span>
            </div>
          </DialogHeader>

          {/* Narrative */}
          <div style={{ borderTop: '1px solid var(--bd-s)', paddingTop: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>
              {story.narrative}
            </p>
          </div>

          {/* Event log */}
          {story.events.length > 0 && (
            <div style={{ borderTop: '1px solid var(--bd-s)', paddingTop: 16 }}>
              <EventLog events={story.events} />
            </div>
          )}

          {/* Map features */}
          <div style={{ borderTop: '1px solid var(--bd-s)', paddingTop: 16 }}>
            <StoryFeatures story={story} />
          </div>

          {/* Key facts */}
          <div style={{ borderTop: '1px solid var(--bd-s)', paddingTop: 16 }}>
            <p className="label" style={{ color: 'var(--t4)', marginBottom: 8 }}>KEY FACTS</p>
            {story.keyFacts.map((fact, i) => (
              <p key={i} className="mono" style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>
                → {fact}
              </p>
            ))}
          </div>

          {/* Fly to */}
          <Button variant="outline" size="sm" onClick={() => { onFlyTo(); setModalOpen(false); }}
            className="w-full font-mono text-[10px] tracking-widest"
            style={{ color: 'var(--blue-l)', borderColor: 'var(--blue)', background: 'var(--blue-dim)' }}
          >
            ⊙ FLY TO
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
