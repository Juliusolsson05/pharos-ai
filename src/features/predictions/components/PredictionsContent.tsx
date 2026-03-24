'use client';

import { useMemo,useState } from 'react';

import { AlertCircle,RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { FocusedMarket } from '@/features/predictions/components/FocusedMarket';
import { GroupSection } from '@/features/predictions/components/GroupSection';
import { MarketCard } from '@/features/predictions/components/MarketCard';
import { COL,fmtVol, getLeadProb } from '@/features/predictions/components/utils';
import { usePredictionMarkets } from '@/features/predictions/queries';

import { getAnalyticsLayoutMode, trackPredictionMarketOpened, trackPredictionsViewChanged } from '@/shared/lib/analytics';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';

import { assignGroup, MARKET_GROUPS, UNCATEGORIZED_GROUP } from '@/data/prediction-groups';
import type { PredictionMarket } from '@/types/domain';

const SORT_OPTS = [
  { key: 'volume',      label: 'TOTAL VOL' },
  { key: 'volume24hr',  label: '24H VOL'   },
  { key: 'probability', label: 'PROB'       },
] as const;

type SortBy = typeof SORT_OPTS[number]['key'];

export function PredictionsContent() {
  const { data, isLoading: loading, error: queryError, isFetching: isRefreshing, refetch } = usePredictionMarkets();
  const markets = useMemo(() => data?.markets ?? [], [data?.markets]);
  const fetchedAt = data?.fetchedAt ?? '';
  const error = queryError?.message ?? null;

  const [sortBy,         setSortBy]         = useState<SortBy>('volume');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);
  const [focusedId,      setFocusedId]      = useState<string | null>(null);
  const isMobile = useIsMobile(1024);
  const isLandscapePhone = useIsLandscapePhone();
  const usePageScroll = isMobile && isLandscapePhone;
  const onLandscapeScroll = useLandscapeScrollEmitter(usePageScroll);
  const layoutMode = getAnalyticsLayoutMode({ isLandscapePhone, isMobile });

  const trackMarketOpen = (marketId: string, groupId: string) => {
    trackPredictionMarketOpened({
      active_only: showActiveOnly,
      group_id: groupId,
      layout_mode: layoutMode,
      market_id: marketId,
      pathname: '/dashboard/predictions',
      sort_by: sortBy,
      surface: 'dashboard_predictions',
    });
  };

  const handleRefresh = async () => {
    try {
      const result = await refetch();
      toast.success(`${result.data?.markets.length ?? 0} markets loaded`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Fetch failed: ${msg}`);
    }
  };

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
            <span className="mono ml-1.5 text-[length:var(--text-caption)] text-[var(--success)]">({activeCount} LIVE)</span>
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
          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{lastUpdated}</span>
          <Button variant="outline" size="icon-sm" onClick={handleRefresh} disabled={loading} className="border-[var(--bd)] bg-transparent text-[var(--t3)]">
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
          <div className="label pl-0.5 text-[length:var(--text-tiny)]">MARKET</div>

          <ToggleGroup
            type="single"
            value={sortBy}
            onValueChange={value => {
              if (!value || value === sortBy) return;
              setSortBy(value as SortBy);
              trackPredictionsViewChanged({
                control: 'sort',
                layout_mode: layoutMode,
                pathname: '/dashboard/predictions',
                surface: 'dashboard_predictions',
                value,
              });
            }}
            className="contents"
          >
            {SORT_OPTS.map(col => (
              <ToggleGroupItem
                key={col.key}
                value={col.key}
                className={`mono bg-transparent border-none h-[30px] rounded-none p-0 flex items-center text-[length:var(--text-tiny)] tracking-[0.08em] ${col.key === 'probability' ? 'justify-start pr-0' : 'justify-end pr-3'} ${sortBy === col.key ? 'font-bold text-[var(--blue-l)]' : 'font-normal text-[var(--t4)]'}`}
              >
                {col.label}{sortBy === col.key ? ' ▼' : ''}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="label text-right pr-3 text-[length:var(--text-tiny)]">ENDS</div>

          <div className="flex justify-end items-center gap-1.5 pr-2">
            <span className="label text-[length:var(--text-micro)] font-bold" style={{ color: showActiveOnly ? 'var(--success)' : 'var(--t4)' }}>LIVE</span>
            <Switch
              checked={showActiveOnly}
              onCheckedChange={value => {
                setShowActiveOnly(value);
                trackPredictionsViewChanged({
                  control: 'active_only',
                  layout_mode: layoutMode,
                  pathname: '/dashboard/predictions',
                  surface: 'dashboard_predictions',
                  value,
                });
              }}
              className="scale-75 origin-right"
            />
          </div>
          <div />
        </div>
      ) : (
        <div className={`shrink-0 flex items-center gap-2 bg-[var(--bg-app)] border-b border-[var(--bd)] overflow-x-auto touch-scroll ${usePageScroll ? 'py-1.5 safe-px' : 'px-3 py-2'}`}>
          <ToggleGroup
            type="single"
            value={sortBy}
            onValueChange={value => {
              if (!value || value === sortBy) return;
              setSortBy(value as SortBy);
              trackPredictionsViewChanged({
                control: 'sort',
                layout_mode: layoutMode,
                pathname: '/dashboard/predictions',
                surface: 'dashboard_predictions',
                value,
              });
            }}
            className="flex gap-1"
          >
            {SORT_OPTS.map(col => (
              <ToggleGroupItem
                key={col.key}
                value={col.key}
                className={`mono px-2 h-7 rounded text-[length:var(--text-caption)] border ${sortBy === col.key ? 'text-[var(--t1)] border-white/25 bg-white/10' : 'text-[var(--t4)] border-transparent bg-transparent'}`}
              >
                {col.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="ml-auto flex items-center gap-2 pr-1">
            <span className="label text-[length:var(--text-tiny)]" style={{ color: showActiveOnly ? 'var(--success)' : 'var(--t4)' }}>LIVE</span>
            <Switch
              checked={showActiveOnly}
              onCheckedChange={value => {
                setShowActiveOnly(value);
                trackPredictionsViewChanged({
                  control: 'active_only',
                  layout_mode: layoutMode,
                  pathname: '/dashboard/predictions',
                  surface: 'dashboard_predictions',
                  value,
                });
              }}
              className="scale-80 origin-right"
            />
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
              <AlertDescription className="mono text-[length:var(--text-body-sm)] text-[var(--danger)]">
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
                  onFocus={() => {
                    setFocusedId(market.id);
                    trackMarketOpen(market.id, group.id);
                  }}
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
              onToggle={id => {
                const nextId = expandedId === id ? null : id;
                setExpandedId(nextId);
                if (nextId) {
                  trackMarketOpen(id, group.id);
                }
              }}
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
