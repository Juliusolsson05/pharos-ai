'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ECONOMIC_INDEXES, ECON_CATEGORIES, type EconCategory } from '@/data/economicIndexes';
import type { MarketResult } from '@/app/api/markets/route';
import { IndexCard } from '@/components/economics/IndexCard';
import { FocusedChart } from '@/components/economics/FocusedChart';

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

export default function EconomicsPage() {
  const [marketData, setMarketData] = useState<Map<string, MarketResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [rangeIdx, setRangeIdx] = useState(1); // default 5D
  const [tierFilter, setTierFilter] = useState(0); // 0 = all
  const [catFilter, setCatFilter] = useState<EconCategory | 'ALL'>('ALL');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const range = RANGES[rangeIdx];

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const tickers = ECONOMIC_INDEXES.map(i => i.ticker).join(',');
      const res = await fetch(`/api/markets?tickers=${encodeURIComponent(tickers)}&range=${range.key}&interval=${range.interval}`);
      const json = await res.json();

      const map = new Map<string, MarketResult>();
      for (const r of (json.results ?? []) as MarketResult[]) {
        map.set(r.ticker, r);
      }
      setMarketData(map);
      setLastRefresh(Date.now());
    } catch (err) {
      console.error('Market fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 2 min
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchAll(), 2 * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  const filtered = ECONOMIC_INDEXES.filter(idx => {
    if (tierFilter > 0 && idx.tier !== tierFilter) return false;
    if (catFilter !== 'ALL' && idx.category !== catFilter) return false;
    return true;
  });

  const timeSince = lastRefresh ? `${Math.floor((Date.now() - lastRefresh) / 1000)}s ago` : 'loading…';

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--bd)] bg-[var(--bg-app)] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/data"
            className="mono text-[10px] text-[var(--t4)] hover:text-[var(--t2)] no-underline transition-colors"
          >
            ← DATA
          </Link>
          <div className="w-px h-4 bg-[var(--bd)]" />
          <span className="mono text-[10px] font-bold text-[var(--t1)] tracking-wider">ECONOMIC INDICATORS</span>
          <span className="mono text-[9px] text-[var(--t4)]">{ECONOMIC_INDEXES.length} indexes</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Range selector */}
          <div className="flex gap-1">
            {RANGES.map((r, i) => (
              <button
                key={r.key}
                onClick={() => setRangeIdx(i)}
                className={`px-2 py-1 rounded text-[9px] mono font-bold tracking-wider transition-colors ${
                  i === rangeIdx
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-[var(--bd)]" />

          {/* Refresh */}
          <button
            onClick={() => fetchAll()}
            disabled={refreshing}
            className="flex items-center gap-2 px-2 py-1 rounded text-[9px] mono text-[var(--t4)] hover:text-[var(--t2)] transition-colors disabled:opacity-40"
          >
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={refreshing ? 'animate-spin' : ''}
            >
              <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" />
              <path d="M1 1v4h4M11 11v-4h-4" />
            </svg>
            REFRESH
          </button>

          <div className="flex items-center gap-2">
            <div className={`dot ${refreshing ? 'dot-warn' : 'dot-live'}`} />
            <span className="mono text-[9px] text-[var(--t4)]">
              {refreshing ? 'refreshing…' : timeSince}
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 px-5 py-2 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0 overflow-x-auto">
        {/* Tier filters */}
        <span className="mono text-[8px] text-[var(--t4)] shrink-0">TIER:</span>
        <div className="flex gap-1">
          {TIER_FILTERS.map(t => (
            <button
              key={t.key}
              onClick={() => setTierFilter(t.key)}
              className={`px-2 py-1 rounded text-[8px] mono font-bold tracking-wider transition-colors shrink-0 ${
                tierFilter === t.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--bd)]" />

        {/* Category filters */}
        <span className="mono text-[8px] text-[var(--t4)] shrink-0">SECTOR:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setCatFilter('ALL')}
            className={`px-2 py-1 rounded text-[8px] mono font-bold tracking-wider transition-colors shrink-0 ${
              catFilter === 'ALL'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent'
            }`}
          >
            ALL
          </button>
          {ECON_CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCatFilter(c.key)}
              className={`px-2 py-1 rounded text-[8px] mono font-bold tracking-wider transition-colors shrink-0 ${
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
            </button>
          ))}
        </div>

        <span className="mono text-[8px] text-[var(--t4)] ml-auto shrink-0">{filtered.length} shown</span>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(idx => (
            <IndexCard
              key={idx.id}
              index={idx}
              data={marketData.get(idx.ticker)}
              loading={loading}
              onFocus={() => setFocusedId(idx.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <span className="mono text-[11px] text-[var(--t4)]">No indexes match current filters</span>
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
            onClose={() => setFocusedId(null)}
          />
        );
      })()}
    </div>
  );
}
