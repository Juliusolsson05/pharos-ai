'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { CURRENT_APP_SYMBOL_CATALOG } from '@/features/map/symbology/catalog/current-app-catalog';
import { renderSymbolEntry } from '@/features/map/symbology/render/milsymbol-renderer';
import type { StandardIdentity, SymbolEntry } from '@/features/map/symbology/types';

const IDENTITIES: { id: StandardIdentity; label: string; color: string }[] = [
  { id: 'friendly', label: 'Friendly', color: 'var(--blue-l)' },
  { id: 'hostile', label: 'Hostile', color: 'var(--danger)' },
  { id: 'neutral', label: 'Neutral', color: 'var(--success)' },
  { id: 'unknown', label: 'Unknown', color: 'var(--warning)' },
];

const SYMBOL_SET_LABELS: Record<string, string> = {
  'air': 'AIR',
  'sea-surface': 'SEA SURFACE',
  'sea-subsurface': 'SEA SUBSURFACE',
  'land-installation': 'LAND INSTALLATION',
  'activities': 'ACTIVITIES',
  'theme': 'THEMATIC',
};

function SymbolCard({ entry }: { entry: SymbolEntry }) {
  const variants = useMemo(() => {
    if (entry.definition.kind === 'svg') {
      return [{ identity: 'unknown' as StandardIdentity, rendered: renderSymbolEntry(entry, 'unknown') }];
    }

    const supported = (entry.definition.kind === 'milsymbol' && entry.definition.supportedIdentities)
      ? entry.definition.supportedIdentities
      : ['friendly', 'hostile', 'neutral', 'unknown'] as StandardIdentity[];

    return supported.map((identity) => ({
      identity,
      rendered: renderSymbolEntry(entry, identity),
    }));
  }, [entry]);

  return (
    <div className="symbol-card">
      <div className="symbol-card-header">
        <span className="symbol-card-id">{entry.id}</span>
        <span className="symbol-card-set">{SYMBOL_SET_LABELS[entry.symbolSet] || entry.symbolSet}</span>
      </div>

      <div className="symbol-card-title">{entry.label}</div>
      <div className="symbol-card-plain">{entry.plainLabel}</div>

      <div className="symbol-card-variants">
        {variants.map(({ identity, rendered }) => {
          const meta = IDENTITIES.find((i) => i.id === identity);
          return (
            <div key={identity} className="symbol-variant">
              <img
                src={rendered.url}
                width={rendered.width}
                height={rendered.height}
                alt={`${entry.label} — ${identity}`}
                className="symbol-variant-img"
              />
              <span className="symbol-variant-label" style={{ color: meta?.color || 'var(--t3)' }}>
                {meta?.label || identity}
              </span>
            </div>
          );
        })}
      </div>

      <div className="symbol-card-desc">{entry.description}</div>

      {entry.keywords.length > 0 && (
        <div className="symbol-card-keywords">
          {entry.keywords.map((kw) => (
            <span key={kw} className="symbol-keyword">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SymbolsPage() {
  const grouped = useMemo(() => {
    const groups = new Map<string, SymbolEntry[]>();
    for (const entry of CURRENT_APP_SYMBOL_CATALOG) {
      const key = entry.symbolSet;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
    return [...groups.entries()];
  }, []);

  return (
    <div className="symbols-page">
      <header className="symbols-header">
        <Link href="/" className="symbols-back">← Map</Link>
        <div>
          <div className="eyebrow">PHAROS / OSINT</div>
          <h1>Symbol Reference</h1>
        </div>
        <p className="symbols-subtitle">
          MIL-STD-2525D military symbology and thematic icons used on the OSINT map.
          Each symbol is shown in all supported affiliation variants.
        </p>
      </header>

      <div className="symbols-legend-bar">
        {IDENTITIES.map((i) => (
          <span key={i.id} className="symbols-legend-item" style={{ color: i.color }}>
            ● {i.label}
          </span>
        ))}
      </div>

      {grouped.map(([setKey, entries]) => (
        <section key={setKey} className="symbols-section">
          <h2 className="symbols-section-title">
            {SYMBOL_SET_LABELS[setKey] || setKey}
            <span className="symbols-section-count">{entries.length}</span>
          </h2>
          <div className="symbols-grid">
            {entries.map((entry) => (
              <SymbolCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}

      <footer className="symbols-footer">
        <p>Symbols rendered by <strong>milsymbol</strong> (MIL-STD-2525D). Thematic icons are custom SVG.</p>
        <p>{CURRENT_APP_SYMBOL_CATALOG.length} symbols in catalog.</p>
      </footer>
    </div>
  );
}
