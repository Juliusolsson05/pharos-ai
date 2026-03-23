'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { track } from '@/shared/lib/analytics';

import { Button } from '@/components/ui/button';

import { FocusedChart } from '@/features/economics/components/FocusedChart';
import { IndexCard } from '@/features/economics/components/IndexCard';
import { useEconomicIndexes, useMarketData } from '@/features/economics/queries';

import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';
import { useNow } from '@/shared/hooks/use-now';

import { ECON_CATEGORIES } from '@/data/economic-indexes';
import type { EconCategory, EconomicIndex, MarketResult } from '@/types/domain';

const RANGES = [
  { key: '1d',  label: '1D',  interval: '5m'  },
  { key: '5d',  label: '5D',  interval: '15m' },
  { key: '1mo', label: '1M',  interval: '1h'  },
  { key: '3mo', label: '3M',  interval: '1d'  },
  { key: '6mo', label: '6M',  interval: '1d'  },
  { key: '1y',  label: '1Y',  interval: '1wk' },
] as const;

const TIER_FILTERS = [
  { key: 0,  label: 'ALL' },
  { key: 1,  label: 'TIER 1 — CRITICAL' },
  { key: 2,  label: 'TIER 2 — IMPORTANT' },
  { key: 3,  label: 'TIER 3 — CONTEXT' },
] as const;

export function EconomicsContent() {
  const [rangeIdx, setRangeIdx] = useState(1); // default 5D
  const [tierFilter, setTierFilter] = useState(0); // 0 = all
  const [catFilter, setCatFilter] = useState<EconCategory | 'ALL'>('ALL');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const now = useNow();
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);

  const { data: econIndexes } = useEconomicIndexes();
  const ECONOMIC_INDEXES: EconomicIndex[] = useMemo(() => econIndexes ?? [], [econIndexes]);

  const range = RANGES[rangeIdx];
  const tickers = useMemo(() => ECONOMIC_INDEXES.map(i => i.ticker), [ECONOMIC_INDEXES]);

  const { data: marketResponse, isLoading: loading, isFetching: refreshing, dataUpdatedAt: lastRefresh, refetch: fetchAll } = useMarketData(tickers, range);

  const marketData = useMemo(() => {
    const map = new Map<string, MarketResult>();
    for (const r of (marketResponse?.results ?? []) as MarketResult[]) {
      map.set(r.ticker, r);
    }
    return map;
  }, [marketResponse]);

  const filtered = ECONOMIC_INDEXES.filter(idx => {
    if (tierFilter > 0 && idx.tier !== tierFilter) return false;
    if (catFilter !== 'ALL' && idx.category !== catFilter) return false;
    return true;
  });

  const timeSince = lastRefresh > 0 ? `${Math.floor((now - lastRefresh) / 1000)}s ago` : 'loading…';

  return (
    <div
      className={`flex flex-col w-full h-full min-h-0 ${isLandscapePhone ? 'overflow-y-auto' : ''}`}
      onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
    >
      {/* ── Top bar ── */}
      <div className={`flex items-center justify-between py-2 border-b border-[var(--bd)] bg-[var(--bg-app)] shrink-0 ${isLandscapePhone ? 'safe-px' : 'px-5'}`}>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/data"
            className="mono text-[length:var(--text-label)] text-[var(--t4)] hover:text-[var(--t2)] no-underline transition-colors"
          >
            ← DATA
          </Link>
          <div className="w-px h-4 bg-[var(--bd)]" />
          <span className="mono text-[length:var(--text-label)] font-bold text-[var(--t1)] tracking-wider">ECONOMIC INDICATORS</span>
          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{ECONOMIC_INDEXES.length} indexes</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Range selector */}
          <div className="flex gap-1">
            {RANGES.map((r, i) => (
              <Button
                key={r.key}
                variant="ghost"
                size="sm"
                onClick={() => { setRangeIdx(i); track('economics_range_changed', { range: r.label }); }}
                className={`px-2 py-1 h-auto rounded text-[length:var(--text-caption)] mono font-bold tracking-wider shrink-0 ${
                  i === rangeIdx
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
                }`}
              >
                {r.label}
              </Button>
            ))}
          </div>

          <div className="w-px h-4 bg-[var(--bd)]" />

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchAll()}
            disabled={refreshing}
            className="flex items-center gap-2 h-auto px-2 py-1 text-[length:var(--text-caption)] mono text-[var(--t4)] hover:text-[var(--t2)] disabled:opacity-40"
          >
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={refreshing ? 'animate-spin' : ''}
            >
              <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" />
              <path d="M1 1v4h4M11 11v-4h-4" />
            </svg>
            REFRESH
          </Button>

          <div className="flex items-center gap-2">
            <div className={`dot ${refreshing ? 'dot-warn' : 'dot-live'}`} />
            <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">
              {refreshing ? 'refreshing…' : timeSince}
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className={`flex items-center gap-3 py-2 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0 overflow-x-auto ${isLandscapePhone ? 'safe-px' : 'px-5'}`}>
        {/* Tier filters */}
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] shrink-0">TIER:</span>
        <div className="flex gap-1">
          {TIER_FILTERS.map(t => (
            <Button
              key={t.key}
              variant="ghost"
              size="sm"
              onClick={() => setTierFilter(t.key)}
              className={`px-2 py-1 h-auto rounded text-[length:var(--text-tiny)] mono font-bold tracking-wider shrink-0 ${
                tierFilter === t.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
              }`}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--bd)]" />

        {/* Category filters */}
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] shrink-0">SECTOR:</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCatFilter('ALL')}
            className={`px-2 py-1 h-auto rounded text-[length:var(--text-tiny)] mono font-bold tracking-wider shrink-0 ${
              catFilter === 'ALL'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
            }`}
          >
            ALL
          </Button>
          {ECON_CATEGORIES.map(c => (
            <Button
              key={c.key}
              variant="ghost"
              size="sm"
              onClick={() => setCatFilter(c.key)}
              className={`px-2 py-1 h-auto rounded text-[length:var(--text-tiny)] mono font-bold tracking-wider shrink-0 ${
                catFilter === c.key
                  ? 'border'
                  : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
              }`}
              style={catFilter === c.key ? { color: c.color, background: `${c.color}15`, borderColor: `${c.color}40` } : undefined}
            >
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label}
              </div>
            </Button>
          ))}
        </div>

        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] ml-auto shrink-0">{filtered.length} shown</span>
      </div>

      {/* ── Grid ── */}
      <div className={isLandscapePhone ? 'p-3 safe-px' : 'flex-1 overflow-y-auto p-4'}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(idx => (
            <IndexCard
              key={idx.id}
              index={idx}
              data={marketData.get(idx.ticker)}
              loading={loading}
              onFocus={() => { setFocusedId(idx.id); track('economics_index_focused', { index_id: idx.id, ticker: idx.ticker }); }}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <span className="mono text-[length:var(--text-body-sm)] text-[var(--t4)]">No indexes match current filters</span>
          </div>
        )}
      </div>

      {/* Focus overlay */}
      {focusedId && (() => {
        const idx = ECONOMIC_INDEXES.find(i => i.id === focusedId);
        const d = idx ? marketData.get(idx.ticker) : undefined;
        if (!idx || !d || d.error) return null;
        return (
          <FocusedChart
            index={idx}
            data={d}
            initialRangeKey={RANGES[rangeIdx].key}
            onClose={() => setFocusedId(null)}
          />
        );
      })()}
    </div>
  );
}
