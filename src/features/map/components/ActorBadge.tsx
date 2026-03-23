'use client';

import type { ActorKey,ActorMeta } from '@/data/map-tokens';

const FALLBACK_META: ActorMeta = {
  label: '??', cssVar: 'var(--t3)', rgb: [143, 153, 168],
  affiliation: 'NEUTRAL', group: 'Unknown',
};

type Props = {
  actor:      ActorKey;
  actorMeta:  Record<string, ActorMeta>;
  isActive?:  boolean;  // true = opaque chip, false = muted/ghost
};

export function ActorBadge({ actor, actorMeta, isActive = true }: Props) {
  const meta = actorMeta[actor] ?? FALLBACK_META;

  return (
    <span
      className="mono"
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           4,
        padding:       '2px 7px',
        borderRadius:  2,
        fontSize: 'var(--text-caption)',
        fontWeight:    700,
        letterSpacing: '0.07em',
        color:         isActive ? meta.cssVar : 'var(--t4)',
        background:    isActive ? `color-mix(in srgb, ${meta.cssVar} 14%, transparent)` : 'transparent',
        border:        `1px solid ${isActive ? `color-mix(in srgb, ${meta.cssVar} 35%, transparent)` : 'var(--bd-s)'}`,
        transition:    'color 0.12s, background 0.12s, border-color 0.12s',
        whiteSpace:    'nowrap',
      }}
    >
      <span
        style={{
          width:        5,
          height:       5,
          borderRadius: '50%',
          background:   isActive ? meta.cssVar : 'var(--t4)',
          flexShrink:   0,
          transition:   'background 0.12s',
        }}
      />
      {meta.label}
    </span>
  );
}
