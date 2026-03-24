'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { FocusedMarket } from '@/features/predictions/components/FocusedMarket';
import { MarketCard } from '@/features/predictions/components/MarketCard';
import { fmtVol, getLeadProb } from '@/features/predictions/components/utils';
import { usePredictionMarkets } from '@/features/predictions/queries';

import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';
import { useNow } from '@/shared/hooks/use-now';

import { assignGroup,MARKET_GROUPS, UNCATEGORIZED_GROUP } from '@/data/prediction-groups';

const ALL_GROUPS = [...MARKET_GROUPS, UNCATEGORIZED_GROUP];

const SORT_OPTS = [
  { key: 'volume',      label: 'TOTAL VOL'  },
  { key: 'volume24hr',  label: '24H VOL'    },
  { key: 'probability', label: 'PROBABILITY' },
  { key: 'spread',      label: 'SPREAD'      },
] as const;

type SortKey = typeof SORT_OPTS[number]['key'];

export function PredictionsDataContent() {
  const { data, isLoading: loading, isFetching: refreshing, error: queryError, dataUpdatedAt, refetch } = usePredictionMarkets();
  const markets = data?.markets ?? [];
  const error = queryError?.message ?? null;
  const fetchedAt = dataUpdatedAt;

  const [sortBy,       setSortBy]       = useState<SortKey>('volume');
  const [liveOnly,     setLiveOnly]     = useState(true);
  const [groupFilter,  setGroupFilter]  = useState<string>('ALL');
  const [focusedId,    setFocusedId]    = useState<string | null>(null);
  const now = useNow();
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);

  // Filtered + sorted markets
  const processed = useMemo(() => {
    let m = markets;
    if (liveOnly) m = m.filter(x => x.active && !x.closed);
    if (groupFilter !== 'ALL') m = m.filter(x => assignGroup(x.title).id === groupFilter);

    return [...m].sort((a, b) => {
      switch (sortBy) {
        case 'volume24hr':  return b.volume24hr - a.volume24hr;
        case 'probability': return getLeadProb(b) - getLeadProb(a);
        case 'spread':      return a.spread - b.spread; // tightest first
        default:            return b.volume - a.volume;
      }
    });
  }, [markets, liveOnly, groupFilter, sortBy]);

  // Group counts for tab badges
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: markets.filter(m => !liveOnly || (m.active && !m.closed)).length };
    for (const g of ALL_GROUPS) {
      counts[g.id] = markets.filter(m => {
        if (liveOnly && (!m.active || m.closed)) return false;
        return assignGroup(m.title).id === g.id;
      }).length;
    }
    return counts;
  }, [markets, liveOnly]);

  const totalVol   = markets.reduce((s, m) => s + m.volume, 0);
  const totalVol24 = markets.reduce((s, m) => s + m.volume24hr, 0);
  const liveCount  = markets.filter(m => m.active && !m.closed).length;
  const timeSince = fetchedAt ? `${Math.floor((now - fetchedAt) / 1000)}s ago` : 'loading…';

  const focusedMarket = focusedId ? markets.find(m => m.id === focusedId) ?? null : null;
  const focusedGroup  = focusedMarket ? assignGroup(focusedMarket.title) : null;

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
          <span className="mono text-[length:var(--text-label)] font-bold text-[var(--t1)] tracking-wider">PREDICTION MARKETS</span>
          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">via Polymarket</span>
        </div>

        <div className="flex items-center gap-5">
          {/* Stats */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-widest">MARKETS</span>
              <span className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--t1)]">{markets.length}</span>
              <span className="mono text-[length:var(--text-caption)]" style={{ color: 'var(--success)' }}>({liveCount} LIVE)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-widest">TOTAL VOL</span>
              <span className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--t1)]">{fmtVol(totalVol)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-widest">24H VOL</span>
              <span className="mono text-[length:var(--text-body-sm)] font-bold" style={{ color: 'var(--success)' }}>{fmtVol(totalVol24)}</span>
            </div>
          </div>

          <div className="w-px h-4 bg-[var(--bd)]" />

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
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
            <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{refreshing ? 'refreshing…' : timeSince}</span>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className={`flex items-center gap-3 py-2 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0 overflow-x-auto ${isLandscapePhone ? 'safe-px' : 'px-5'}`}>

        {/* Group filter tabs */}
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] shrink-0">GROUP:</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGroupFilter('ALL')}
            className={`px-2 py-1 h-auto rounded text-[length:var(--text-tiny)] mono font-bold tracking-wider shrink-0 ${
              groupFilter === 'ALL'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
            }`}
          >
            ALL <span className="opacity-60">({groupCounts['ALL'] ?? 0})</span>
          </Button>
          {ALL_GROUPS.map(g => (
            <Button
              key={g.id}
              variant="ghost"
              size="sm"
              onClick={() => setGroupFilter(g.id)}
              className={`px-2 py-1 h-auto rounded text-[length:var(--text-tiny)] mono font-bold tracking-wider shrink-0 ${
                groupFilter === g.id
                  ? 'border'
                  : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
              }`}
              style={groupFilter === g.id
                ? { color: g.color, background: g.bg, borderColor: g.border }
                : undefined}
            >
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                {g.label} <span className="opacity-60">({groupCounts[g.id] ?? 0})</span>
              </div>
            </Button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--bd)]" />

        {/* Sort */}
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] shrink-0">SORT:</span>
        <div className="flex gap-1">
          {SORT_OPTS.map(s => (
            <Button
              key={s.key}
              variant="ghost"
              size="sm"
              onClick={() => setSortBy(s.key)}
              className={`px-2 py-1 h-auto rounded text-[length:var(--text-tiny)] mono font-bold tracking-wider shrink-0 ${
                sortBy === s.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
              }`}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--bd)]" />

        {/* Live only toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLiveOnly(v => !v)}
          className={`flex items-center gap-1.5 h-auto px-2 py-1 rounded text-[length:var(--text-tiny)] mono font-bold tracking-wider shrink-0 ${
            liveOnly
              ? 'text-[var(--success)] bg-[var(--success-dim)] border-[rgba(35,162,109,0.3)]'
              : 'text-[var(--t4)] border-transparent hover:text-[var(--t2)]'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${liveOnly ? 'animate-pulse' : ''}`}
               style={{ backgroundColor: liveOnly ? 'var(--success)' : 'var(--t4)' }} />
          LIVE ONLY
        </Button>

        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] ml-auto shrink-0">{processed.length} shown</span>
      </div>

      {/* ── Grid ── */}
      <div className={isLandscapePhone ? 'p-3 safe-px' : 'flex-1 overflow-y-auto p-4'}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[220px] bg-[var(--bg-1)] border border-[var(--bd)] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mono text-[length:var(--text-body-sm)] text-[var(--danger)] mb-2">FETCH ERROR</div>
              <div className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{error}</div>
              <Button
                variant="outline"
                size="sm"
            onClick={() => refetch()}
                className="mt-4 mono text-[length:var(--text-caption)] h-auto px-3 py-1.5 border-[var(--bd)] text-[var(--t3)] hover:text-[var(--t1)] hover:border-white/20"
              >
                RETRY
              </Button>
            </div>
          </div>
        ) : processed.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <span className="mono text-[length:var(--text-body-sm)] text-[var(--t4)]">No markets match current filters</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {processed.map((market, i) => {
              const group = assignGroup(market.title);
              return (
                <MarketCard
                  key={market.id}
                  market={market}
                  group={group}
                  rank={i + 1}
                  onFocus={() => setFocusedId(market.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Focus overlay ── */}
      {focusedMarket && focusedGroup && (
        <FocusedMarket
          market={focusedMarket}
          group={focusedGroup}
          onClose={() => setFocusedId(null)}
        />
      )}
    </div>
  );
}
