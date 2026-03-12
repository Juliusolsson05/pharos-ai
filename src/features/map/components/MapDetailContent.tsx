'use client';

import { Button } from '@/components/ui/button';

import { useMapData, useMapStories } from '@/features/map/queries';

import { fmtDate, fmtTimeZ } from '@/shared/lib/format';

import type { Asset, MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { ActorMeta } from '@/data/map-tokens';
import { CATEGORY_LABEL, STATUS_META, type MarkerStatus } from '@/data/map-tokens';
import type { MapStory } from '@/types/domain';

const FALLBACK_STATUS = { label: 'Unknown', cssVar: 'var(--t4)' } as const;

/** Safe STATUS_META lookup — returns fallback for null/unknown status values. */
function statusMeta(status: string | null | undefined) {
  if (!status) return FALLBACK_STATUS;
  return STATUS_META[status as MarkerStatus] ?? FALLBACK_STATUS;
}

import { StoryIcon } from './StoryIcon';
import type { SelectedItem } from './types';

// Fallback for unknown actors

const FALLBACK_META: ActorMeta = {
  label: '??', cssVar: 'var(--t3)', rgb: [143, 153, 168],
  affiliation: 'NEUTRAL', group: 'Unknown',
};

function am(key: string, meta: Record<string, ActorMeta>): ActorMeta {
  return meta[key] ?? FALLBACK_META;
}

function useMapCrossRefData() {
  const { data: rawData } = useMapData();
  const { data: stories = [] } = useMapStories();
  const actorMeta = rawData?.actorMeta ?? {};
  return { rawData, stories, actorMeta };
}

// Atoms

export function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-baseline" style={{ marginBottom: 6 }}>
      <span className="label" style={{ color: 'var(--t4)' }}>{label}</span>
      <span className="mono" style={{ color: color ?? 'var(--t2)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="mono" style={{
      fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 2,
      color, background: `color-mix(in srgb, ${color} 14%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
      letterSpacing: '0.07em',
    }}>
      {label}
    </span>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: 'var(--bd-s)', margin: '12px 0' }} />;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="label" style={{ color: 'var(--t4)', marginBottom: 8 }}>{children}</p>;
}

// Hierarchy breadcrumb

export function HierarchyBreadcrumb({ actor, category, type, actorMeta }: { actor: string; category: string; type: string; actorMeta: Record<string, ActorMeta> }) {
  const m = am(actor, actorMeta);
  const catLabel = CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL] ?? category;
  return (
    <div className="flex items-center gap-1 mono" style={{ fontSize: 9, marginBottom: 10, flexWrap: 'wrap' }}>
      <span style={{ color: m.cssVar, fontWeight: 700 }}>{m.label}</span>
      <span style={{ color: 'var(--bd)' }}>›</span>
      <span style={{ color: 'var(--t3)' }}>{catLabel}</span>
      <span style={{ color: 'var(--bd)' }}>›</span>
      <span style={{ color: 'var(--t4)' }}>{type.replace(/_/g, ' ')}</span>
    </div>
  );
}

// Cross-link helpers

function strikesForTarget(t: Target, strikes: StrikeArc[]): StrikeArc[] {
  return strikes.filter(s =>
    Math.abs(s.to[0] - t.position[0]) < 0.05 && Math.abs(s.to[1] - t.position[1]) < 0.05,
  );
}

function targetForStrike(s: StrikeArc, targets: Target[]): Target | null {
  return targets.find(t =>
    Math.abs(t.position[0] - s.to[0]) < 0.05 && Math.abs(t.position[1] - s.to[1]) < 0.05,
  ) ?? null;
}

function storiesFor(ids: string[], field: keyof MapStory, stories: MapStory[]): MapStory[] {
  return stories.filter(s => (s[field] as string[]).some(id => ids.includes(id)));
}

export function RelatedStories({ stories, onActivate }: { stories: MapStory[]; onActivate: (s: MapStory) => void }) {
  if (!stories.length) return null;
  return (
    <>
      <Divider />
      <SectionLabel>RELATED STORIES</SectionLabel>
      <div className="flex flex-col gap-1">
        {stories.map(story => (
          <Button variant="ghost" key={story.id} onClick={() => onActivate(story)}
            className="flex items-center gap-2 text-left w-full hover:border-[var(--bd)] transition-colors" style={{ background: 'var(--bg-1)', border: '1px solid var(--bd-s)', borderRadius: 2, padding: '6px 8px' }}
          >
            <StoryIcon iconName={story.iconName} category={story.category} size={12} boxSize={22} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.title}</p>
              <p className="mono" style={{ fontSize: 9, color: 'var(--blue)', marginTop: 1 }}>{story.category}</p>
            </div>
            <span style={{ color: 'var(--t4)', fontSize: 10 }}>›</span>
          </Button>
        ))}
      </div>
    </>
  );
}

// Content renderers

export function StrikeContent({ d, onSelectItem, onActivateStory }: {
  d: StrikeArc;
  onSelectItem: (i: SelectedItem) => void;
  onActivateStory: (s: MapStory) => void;
}) {
  const { rawData, stories, actorMeta } = useMapCrossRefData();
  const relatedTarget  = rawData ? targetForStrike(d, rawData.targets) : null;
  const relatedStories = storiesFor([d.id], 'highlightStrikeIds', stories);
  const sMeta          = statusMeta(d.status);

  return (
    <>
      <HierarchyBreadcrumb actor={d.actor} category={d.category} type={d.type} actorMeta={actorMeta} />
      <div className="flex gap-1 flex-wrap" style={{ marginBottom: 14 }}>
        <Badge label={d.type.replace('_', ' ')} color={am(d.actor, actorMeta).cssVar} />
        <Badge label={d.severity}               color={d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'} />
        <Badge label={sMeta.label}               color={sMeta.cssVar} />
      </div>
      {d.timestamp && <Row label="TIME" value={`${fmtDate(d.timestamp)} · ${fmtTimeZ(d.timestamp)}`} color="var(--blue-l)" />}
      <Row label="ORIGIN"        value={`[${d.from[1].toFixed(2)}°N, ${d.from[0].toFixed(2)}°E]`} />
      <Row label="TARGET COORDS" value={`[${d.to[1].toFixed(2)}°N, ${d.to[0].toFixed(2)}°E]`} />
      {relatedTarget && (
        <>
          <Divider />
          <SectionLabel>TARGET HIT</SectionLabel>
          <Button variant="ghost" onClick={() => onSelectItem({ type: 'target', data: relatedTarget })}
            className="flex items-center gap-2 w-full text-left hover:border-[var(--bd)] transition-colors" style={{ background: 'var(--bg-1)', border: '1px solid var(--bd-s)', borderRadius: 2, padding: '8px 10px' }}
          >
            <span className="dot" style={{ background: statusMeta(relatedTarget.status).cssVar }} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600 }}>{relatedTarget.name}</p>
              <p className="mono" style={{ fontSize: 9, color: 'var(--t4)', marginTop: 1 }}>
                {relatedTarget.type.replace('_', ' ')} · {relatedTarget.status}
              </p>
            </div>
            <span style={{ color: 'var(--t4)' }}>›</span>
          </Button>
        </>
      )}
      <RelatedStories stories={relatedStories} onActivate={onActivateStory} />
    </>
  );
}

export function MissileContent({ d, onActivateStory }: {
  d: MissileTrack;
  onActivateStory: (s: MapStory) => void;
}) {
  const { stories, actorMeta } = useMapCrossRefData();
  const relatedStories = storiesFor([d.id], 'highlightMissileIds', stories);
  const isIntercepted  = d.status === 'INTERCEPTED';
  const statusColor    = isIntercepted ? 'var(--warning)' : 'var(--danger)';
  const m = am(d.actor, actorMeta);

  return (
    <>
      <HierarchyBreadcrumb actor={d.actor} category={d.category} type={d.type} actorMeta={actorMeta} />
      <div className="flex gap-1 flex-wrap" style={{ marginBottom: 14 }}>
        <Badge label={isIntercepted ? '✓ INTERCEPTED' : '⚠ IMPACT CONFIRMED'} color={statusColor} />
        <Badge label={d.severity} color={d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'} />
      </div>
      {d.timestamp && <Row label="TIME" value={`${fmtDate(d.timestamp)} · ${fmtTimeZ(d.timestamp)}`} color="var(--blue-l)" />}
      <Row label="ACTOR"        value={m.label} color={m.cssVar} />
      <Row label="LAUNCH POINT" value={`[${d.from[1].toFixed(2)}°N, ${d.from[0].toFixed(2)}°E]`} />
      <Row label="IMPACT POINT" value={`[${d.to[1].toFixed(2)}°N, ${d.to[0].toFixed(2)}°E]`} />
      <Divider />
      <div style={{ background: `color-mix(in srgb, ${statusColor} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${statusColor} 30%, transparent)`, borderRadius: 2, padding: '8px 10px' }}>
        <p className="mono" style={{ fontSize: 9, color: statusColor, fontWeight: 700, marginBottom: 4 }}>
          {isIntercepted ? 'INTERCEPTED' : 'IMPACT CONFIRMED'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.5 }}>
          {isIntercepted ? 'Missile neutralized in-flight. No ground impact recorded.' : 'Missile reached target. Damage assessment ongoing.'}
        </p>
      </div>
      <RelatedStories stories={relatedStories} onActivate={onActivateStory} />
    </>
  );
}

export function TargetContent({ d, onSelectItem, onActivateStory }: {
  d: Target;
  onSelectItem: (i: SelectedItem) => void;
  onActivateStory: (s: MapStory) => void;
}) {
  const { rawData, stories, actorMeta } = useMapCrossRefData();
  const tStatusMeta    = statusMeta(d.status);
  const m              = am(d.actor, actorMeta);
  const incomingStrikes = rawData ? strikesForTarget(d, rawData.strikes) : [];
  const relatedStories = storiesFor([d.id], 'highlightTargetIds', stories);

  return (
    <>
      <HierarchyBreadcrumb actor={d.actor} category={d.category} type={d.type} actorMeta={actorMeta} />
      <div className="flex gap-1 flex-wrap" style={{ marginBottom: 12 }}>
        <Badge label={d.type.replace('_', ' ')} color={m.cssVar} />
        <Badge label={tStatusMeta.label}        color={tStatusMeta.cssVar} />
      </div>
      <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>{d.description}</p>
      {d.timestamp && <Row label="TIME" value={`${fmtDate(d.timestamp)} · ${fmtTimeZ(d.timestamp)}`} color="var(--blue-l)" />}
      <Row label="ACTOR"       value={m.label} color={m.cssVar} />
      <Row label="COORDINATES" value={`${d.position[1].toFixed(4)}°N, ${d.position[0].toFixed(4)}°E`} />
      {incomingStrikes.length > 0 && (
        <>
          <Divider />
          <SectionLabel>INCOMING STRIKES ({incomingStrikes.length})</SectionLabel>
          <div className="flex flex-col gap-1">
            {incomingStrikes.map(strike => {
              const sm = am(strike.actor, actorMeta);
              return (
                <Button variant="ghost" key={strike.id} onClick={() => onSelectItem({ type: 'strike', data: strike })}
                  className="flex items-center gap-2 w-full text-left hover:border-[var(--bd)] transition-colors" style={{ background: 'var(--bg-1)', border: '1px solid var(--bd-s)', borderRadius: 2, padding: '6px 8px' }}
                >
                  <div style={{ width: 10, height: 3, background: sm.cssVar, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 10, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{strike.label}</p>
                    <p className="mono" style={{ fontSize: 9, color: sm.cssVar, marginTop: 1 }}>
                      {sm.label} · {strike.type.replace('_', ' ')} · {strike.severity}
                    </p>
                  </div>
                  <span style={{ color: 'var(--t4)' }}>›</span>
                </Button>
              );
            })}
          </div>
        </>
      )}
      <RelatedStories stories={relatedStories} onActivate={onActivateStory} />
    </>
  );
}

export function AssetContent({ d, onActivateStory }: {
  d: Asset;
  onActivateStory: (s: MapStory) => void;
}) {
  const { stories, actorMeta } = useMapCrossRefData();
  const m              = am(d.actor, actorMeta);
  const relatedStories = storiesFor([d.id], 'highlightAssetIds', stories);

  return (
    <>
      <HierarchyBreadcrumb actor={d.actor} category={d.category} type={d.type} actorMeta={actorMeta} />
      <div className="flex gap-1 flex-wrap" style={{ marginBottom: 12 }}>
        <Badge label={m.label}                    color={m.cssVar} />
        <Badge label={d.type.replace('_', ' ')}   color="var(--t3)" />
        <Badge label={statusMeta(d.status).label} color={statusMeta(d.status).cssVar} />
        {d.type === 'CARRIER' && <Badge label="CARRIER STRIKE GROUP" color="var(--warning)" />}
      </div>
      {d.description && (
        <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>{d.description}</p>
      )}
      <Row label="COORDINATES"  value={`${d.position[1].toFixed(2)}°N, ${d.position[0].toFixed(2)}°E`} />
      <Row label="NATION/ACTOR" value={m.label} color={m.cssVar} />
      <Row label="AFFILIATION"  value={m.affiliation} color="var(--success)" />
      <RelatedStories stories={relatedStories} onActivate={onActivateStory} />
    </>
  );
}

const ZONE_META: Record<ThreatZone['type'], { color: string; label: string; description: string }> = {
  CLOSURE:          { color: 'var(--danger)',  label: 'MARITIME CLOSURE',    description: 'Area declared closed to commercial and military shipping. Vessels risk interdiction or engagement.' },
  PATROL:           { color: 'var(--warning)', label: 'ACTIVE PATROL ZONE',  description: 'IRGC Navy operating with fast attack craft. Unidentified vessels subject to challenge and boarding.' },
  NFZ:              { color: 'var(--warning)', label: 'NO-FLY ZONE',         description: 'Iranian-declared NFZ. Uncleared aircraft risk engagement by air defense systems and interceptors.' },
  THREAT_CORRIDOR:  { color: 'var(--danger)',  label: 'THREAT CORRIDOR',     description: 'Active hostile operations. Houthi and proxy forces with anti-ship and anti-air capability.' },
};

export function ZoneContent({ d }: { d: ThreatZone }) {
  const { actorMeta } = useMapCrossRefData();
  const meta = ZONE_META[d.type];
  const m    = am(d.actor, actorMeta);
  return (
    <>
      <HierarchyBreadcrumb actor={d.actor} category={d.category} type={d.type} actorMeta={actorMeta} />
      <div className="flex gap-1 flex-wrap" style={{ marginBottom: 12 }}>
        <Badge label={meta.label} color={meta.color} />
        <Badge label={m.label}    color={m.cssVar} />
      </div>
      <div style={{ background: `color-mix(in srgb, ${meta.color} 6%, transparent)`, border: `1px solid color-mix(in srgb, ${meta.color} 25%, transparent)`, borderRadius: 2, padding: '10px 12px', marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>{meta.description}</p>
      </div>
      <Row label="ZONE TYPE"  value={d.type.replace('_', ' ')} color={meta.color} />
      <Row label="CONTROLLED BY" value={m.label} color={m.cssVar} />
      <Row label="VERTICES"   value={`${d.coordinates.length} points`} />
    </>
  );
}
