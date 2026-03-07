'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { GroupSection } from '@/features/predictions/components/GroupSection';
import { MarketCard } from '@/features/predictions/components/MarketCard';
import { FocusedMarket } from '@/features/predictions/components/FocusedMarket';
import { assignGroup, MARKET_GROUPS, UNCATEGORIZED_GROUP } from '@/data/prediction-groups';
import { fmtVol, getLeadProb, COL } from '@/features/predictions/components/utils';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';
import type { PredictionMarket } from '@/types/domain';

const SORT_OPTS = [
  { key: 'volume',      label: 'TOTAL VOL' },
  { key: 'volume24hr',  label: '24H VOL'   },
  { key: 'probability', label: 'PROB'       },
] as const;

type SortBy = typeof SORT_OPTS[number]['key'];

export function PredictionsContent() {
  const [markets,        setMarkets]        = useState<PredictionMarket[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [sortBy,         setSortBy]         = useState<SortBy>('volume');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [fetchedAt,      setFetchedAt]      = useState('');
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);
  const [focusedId,      setFocusedId]      = useState<string | null>(null);
  const isMobile = useIsMobile(1024);
  const isLandscapePhone = useIsLandscapePhone();
  const usePageScroll = isMobile && isLandscapePhone;
  const onLandscapeScroll = useLandscapeScrollEmitter(usePageScroll);

  const fetchMarkets = async (isManual = false) => {
    setLoading(true); setIsRefreshing(true); setError(null);
    try {
      const res  = await fetch('/api/v1/predictions/markets');
      const data = await res.json() as { markets: PredictionMarket[]; fetchedAt: string; error?: string };
      if (data.error) throw new Error(data.error);
      setMarkets(data.markets);
      setFetchedAt(data.fetchedAt);
      if (isManual) toast.success(`${data.markets.length} markets loaded`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      if (isManual) toast.error(`Fetch failed: ${msg}`);
    } finally {
      setLoading(false); setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchMarkets(); }, []);

  const filtered = useMemo(() => {
    let m = markets;
    if (showActiveOnly) m = m.filter(x => x.active && !x.closed);
    return m;
  }, [markets, showActiveOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, PredictionMarket[]>();
    const allGroups = [...MARKET_GROUPS, UNCATEGORIZED_GROUP];
    for (const g of allGroups) map.set(g.id, []);
    for (const m of filtered) {
      const g = assignGroup(m.title);
      map.get(g.id)!.push(m);
    }
    return map;
  }, [filtered]);

  const rankOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let total = 0;
    for (const g of [...MARKET_GROUPS, UNCATEGORIZED_GROUP]) {
      offsets[g.id] = total;
      total += (grouped.get(g.id)?.length ?? 0);
    }
    return offsets;
  }, [grouped]);

  const mobileSorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'volume24hr') return b.volume24hr - a.volume24hr;
      if (sortBy === 'probability') return getLeadProb(b) - getLeadProb(a);
      return b.volume - a.volume;
    });
  }, [filtered, sortBy]);

  const totalVolume = markets.reduce((s, m) => s + m.volume, 0);
  const totalVol24h = markets.reduce((s, m) => s + m.volume24hr, 0);
  const activeCount = markets.filter(m => m.active && !m.closed).length;
  const lastUpdated = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div
      className={`flex flex-col flex-1 min-w-0 h-full bg-[var(--bg-1)] ${usePageScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}
      onScroll={usePageScroll ? onLandscapeScroll : undefined}
    >

      {/* ── Top bar ── */}
      <div className={`flex items-center gap-4 shrink-0 bg-[var(--bg-app)] border-b border-[var(--bd)] ${usePageScroll ? 'h-9 safe-px' : 'h-[44px] px-3 md:px-4'}`}>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} strokeWidth={2.5} className="text-[var(--blue-l)] shrink-0" />
          <span className="section-title">PREDICTION MARKETS</span>
          <span className="label text-[var(--t4)]">VIA POLYMARKET</span>
        </div>

        <Separator orientation="vertical" className="h-5 bg-[var(--bd)]" />

        {/* Stats */}
        <div className="hidden md:flex gap-5 items-center">
          <div>
            <span className="label text-[var(--t4)]">MARKETS </span>
            <span className="mono font-bold text-[var(--t1)]">{markets.length}</span>
            <span className="mono ml-1.5 text-[9px] text-[var(--success)]">({activeCount} LIVE)</span>
          </div>
          <div>
            <span className="label text-[var(--t4)]">TOTAL VOL </span>
            <span className="mono font-bold text-[var(--t1)]">{fmtVol(totalVolume)}</span>
          </div>
          <div>
            <span className="label text-[var(--t4)]">24H VOL </span>
            <span className="mono font-bold" style={{ color: totalVol24h > 0 ? 'var(--success)' : 'var(--t4)' }}>{fmtVol(totalVol24h)}</span>
          </div>
        </div>

        {/* Refresh + timestamp */}
        <div className="flex items-center gap-2.5 ml-auto">
          <span className="mono text-[9px] text-[var(--t4)]">{lastUpdated}</span>
          <Button variant="outline" size="icon-sm" onClick={() => fetchMarkets(true)} disabled={loading} className="border-[var(--bd)] bg-transparent text-[var(--t3)]">
            <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </Button>
        </div>
      </div>

      {/* ── Column header ── */}
      {!isMobile ? (
        <div
          className="shrink-0 grid items-center h-[30px] bg-[var(--bg-app)] border-b border-[var(--bd)]"
          style={{ gridTemplateColumns: COL }}
        >
          <div />
          <div className="label pl-0.5 text-[8px]">MARKET</div>

          <ToggleGroup type="single" value={sortBy} onValueChange={v => v && setSortBy(v as SortBy)} className="contents">
            {SORT_OPTS.map(col => (
              <ToggleGroupItem
                key={col.key}
                value={col.key}
                className={`mono bg-transparent border-none h-[30px] rounded-none p-0 flex items-center text-[8px] tracking-[0.08em] ${col.key === 'probability' ? 'justify-start pr-0' : 'justify-end pr-3'} ${sortBy === col.key ? 'font-bold text-[var(--blue-l)]' : 'font-normal text-[var(--t4)]'}`}
              >
                {col.label}{sortBy === col.key ? ' ▼' : ''}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="label text-right pr-3 text-[8px]">ENDS</div>

          <div className="flex justify-end items-center gap-1.5 pr-2">
            <span className="label text-[7px] font-bold" style={{ color: showActiveOnly ? 'var(--success)' : 'var(--t4)' }}>LIVE</span>
            <Switch checked={showActiveOnly} onCheckedChange={setShowActiveOnly} className="scale-75 origin-right" />
          </div>
          <div />
        </div>
      ) : (
        <div className={`shrink-0 flex items-center gap-2 bg-[var(--bg-app)] border-b border-[var(--bd)] overflow-x-auto touch-scroll ${usePageScroll ? 'py-1.5 safe-px' : 'px-3 py-2'}`}>
          <ToggleGroup type="single" value={sortBy} onValueChange={v => v && setSortBy(v as SortBy)} className="flex gap-1">
            {SORT_OPTS.map(col => (
              <ToggleGroupItem
                key={col.key}
                value={col.key}
                className={`mono px-2 h-7 rounded text-[9px] border ${sortBy === col.key ? 'text-[var(--t1)] border-white/25 bg-white/10' : 'text-[var(--t4)] border-transparent bg-transparent'}`}
              >
                {col.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="ml-auto flex items-center gap-2 pr-1">
            <span className="label text-[8px]" style={{ color: showActiveOnly ? 'var(--success)' : 'var(--t4)' }}>LIVE</span>
            <Switch checked={showActiveOnly} onCheckedChange={setShowActiveOnly} className="scale-80 origin-right" />
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className={usePageScroll ? '' : 'flex-1 overflow-y-auto'}>
        {loading ? (
          <div className="py-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid items-center h-[44px] border-b border-[var(--bd)] px-1 gap-2" style={{ gridTemplateColumns: COL }}>
                <Skeleton className="h-[10px] w-5 bg-[var(--bg-3)]" />
                <Skeleton className="h-3 bg-[var(--bg-3)]" style={{ width: `${60 + (i % 3) * 20}%` }} />
                <Skeleton className="h-1 w-4/5 bg-[var(--bg-3)]" />
                <Skeleton className="h-[10px] w-[50px] bg-[var(--bg-3)] ml-auto" />
                <Skeleton className="h-[10px] w-10 bg-[var(--bg-3)] ml-auto" />
                <Skeleton className="h-[10px] w-[50px] bg-[var(--bg-3)] ml-auto" />
                <Skeleton className="h-[18px] w-11 bg-[var(--bg-3)] ml-auto" />
                <div />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive" className="bg-[var(--danger-dim)] border-[var(--danger-bd)] text-[var(--danger)]">
              <AlertCircle size={14} />
              <AlertDescription className="mono text-[11px] text-[var(--danger)]">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-[var(--t4)]">
            <span className="label">NO MARKETS FOUND</span>
          </div>
        ) : isMobile ? (
          <div className={`grid grid-cols-1 gap-2 ${usePageScroll ? 'safe-px py-2' : 'p-2'}`}>
            {mobileSorted.map((market, i) => {
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
        ) : (
          [...MARKET_GROUPS, UNCATEGORIZED_GROUP].map(group => (
            <GroupSection
              key={group.id}
              group={group}
              markets={grouped.get(group.id) ?? []}
              expandedId={expandedId}
              onToggle={id => setExpandedId(expandedId === id ? null : id)}
              globalRankOffset={rankOffsets[group.id] ?? 0}
              sortBy={sortBy}
            />
          ))
        )}
      </div>

      {isMobile && focusedId && (() => {
        const market = markets.find(m => m.id === focusedId);
        if (!market) return null;
        return (
          <FocusedMarket
            market={market}
            group={assignGroup(market.title)}
            onClose={() => setFocusedId(null)}
          />
        );
      })()}
    </div>
  );
}
