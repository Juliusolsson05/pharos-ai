
'use client';

import { useMemo, useState } from 'react';

import { CURRENT_APP_SYMBOL_CATALOG } from '../catalog/current-app-catalog';
import { searchSymbolCatalog } from '../catalog/search';
import { renderSymbolEntry, explainSidc } from '../render/milsymbol-renderer';
import type { StandardIdentity } from '../types';

const IDENTITIES: StandardIdentity[] = [
  'friendly',
  'neutral',
  'hostile',
  'unknown',
];

function prettyIdentity(identity: StandardIdentity) {
  switch (identity) {
    case 'friendly':
      return 'Friendly';
    case 'neutral':
      return 'Neutral';
    case 'hostile':
      return 'Hostile';
    case 'assumedFriend':
      return 'Assumed Friend';
    case 'suspect':
      return 'Suspect';
    default:
      return 'Unknown';
  }
}

export function SymbolExplorer() {
  const [query, setQuery] = useState('');
  const [identity, setIdentity] = useState<StandardIdentity>('friendly');
  const results = useMemo(
    () => searchSymbolCatalog(CURRENT_APP_SYMBOL_CATALOG, query),
    [query],
  );

  return (
    <section style={{ padding: 12, display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbols, aliases, plain-English labels..."
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #383E47',
            background: '#252A31',
            color: '#F5F8FA',
          }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {IDENTITIES.map((value) => (
            <button
              key={value}
              onClick={() => setIdentity(value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: value === identity ? '1px solid #4C90F0' : '1px solid #383E47',
                background: value === identity ? 'rgba(76,144,240,0.12)' : '#2F343C',
                color: '#F5F8FA',
                cursor: 'pointer',
              }}
            >
              {prettyIdentity(value)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {results.map(({ entry, highlights }) => {
          const rendered = renderSymbolEntry(entry, identity);
          const sidc = explainSidc(entry, identity);

          return (
            <article
              key={`${entry.id}-${identity}`}
              title={`${entry.plainLabel}${sidc ? ` • ${sidc}` : ''}`}
              style={{
                border: '1px solid #383E47',
                borderRadius: 8,
                background: '#252A31',
                padding: 12,
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ minHeight: 82, display: 'grid', placeItems: 'center', background: '#1C2127', borderRadius: 6 }}>
                <img
                  src={rendered.url}
                  alt={entry.plainLabel}
                  width={Math.min(rendered.width, 96)}
                  height={Math.min(rendered.height, 96)}
                  style={{
                    maxWidth: 96,
                    maxHeight: 96,
                    objectFit: 'contain',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gap: 4 }}>
                <strong style={{ color: '#F5F8FA', fontSize: 13 }}>{entry.plainLabel}</strong>
                <div style={{ color: '#ABB3BF', fontSize: 12 }}>{entry.label}</div>
                <div style={{ color: '#8F99A8', fontSize: 12, lineHeight: 1.5 }}>{entry.description}</div>
              </div>

              <div style={{ display: 'grid', gap: 4, fontSize: 11, color: '#ABB3BF' }}>
                <div><strong>Family:</strong> {entry.symbolSet}</div>
                {sidc ? <div><strong>SIDC:</strong> <span style={{ fontFamily: 'SFMono-Regular, Menlo, monospace' }}>{sidc}</span></div> : null}
                {highlights.length > 0 ? <div><strong>Matched:</strong> {highlights.join(', ')}</div> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
