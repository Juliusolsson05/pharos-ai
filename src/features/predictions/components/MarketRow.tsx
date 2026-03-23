'use client';
import { useState } from 'react';

import { ChevronDown,ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

import type { PredictionMarket } from '@/types/domain';

import { PriceChart } from './PriceChart';
import { SubMarketTable } from './SubMarketTable';
import { COL,fmtMarketDate, fmtVol, getLeadProb, probBg, probColor, spreadColor, statusLabel } from './utils';

type Props = {
  market: PredictionMarket;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
};

export function MarketRow({ market, rank, isExpanded, onToggle }: Props) {
  const [selectedSubId, setSelectedSubId] = useState(
    market.yesTokenId
      ? market.subMarkets.find(s => s.yesTokenId === market.yesTokenId)?.id ?? market.subMarkets[0]?.id ?? ''
      : '',
  );

  const isGroup      = market.subMarkets.length > 1;
  const prob         = getLeadProb(market);
  const color        = probColor(prob);
  const bg           = probBg(prob);
  const status       = statusLabel(market);
  const isBinary     = market.outcomes.length === 2;
  const chartTokenId = isGroup
    ? (market.subMarkets.find(s => s.id === selectedSubId)?.yesTokenId ?? market.yesTokenId)
    : market.yesTokenId;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>

      {/* ── Row trigger ── */}
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="grid gap-0 w-full h-[44px] p-0 rounded-none border-b border-b-[var(--bd)]"
          style={{ gridTemplateColumns: COL, background: isExpanded ? 'var(--bg-2)' : 'transparent' }}
        >
          {/* Rank */}
          <span className="mono flex items-center pl-3.5 text-[var(--t4)] font-bold">
            {rank}
          </span>

          {/* Title + group count badge */}
          <div className="flex items-center gap-2 overflow-hidden pr-5">
            <span className="truncate text-xs font-semibold text-[var(--t1)]">
              {market.title}
            </span>
            {isGroup && (
              <Badge
                variant="outline"
                className="shrink-0 text-[length:var(--text-tiny)] px-[5px] py-px text-[var(--blue-l)] border-[var(--info-bd)] bg-[var(--blue-dim)]"
              >
                {market.subMarkets.length}
              </Badge>
            )}
          </div>

          {/* Probability bar + value */}
          <div className="flex items-center gap-2 pr-3">
            <Progress
              value={prob * 100}
              className="flex-1 h-1 rounded-sm bg-[var(--bg-3)]"
              indicatorStyle={{ background: color }}
            />
            <span
              className="mono font-bold px-[5px] py-px rounded-[2px] min-w-[40px] text-right"
              style={{ color, background: bg }}
            >
              {Math.round(prob * 100)}%
            </span>
          </div>

          {/* Total volume */}
          <span className="mono text-right pr-3 text-[var(--t2)]">
            {fmtVol(market.volume)}
          </span>

          {/* 24h volume */}
          <span className="mono text-right pr-3" style={{ color: market.volume24hr > 0 ? 'var(--success)' : 'var(--t4)' }}>
            {market.volume24hr > 0 ? fmtVol(market.volume24hr) : '—'}
          </span>

          {/* End date */}
          <span className="mono text-right pr-3 text-[length:var(--text-label)] text-[var(--t3)]">
            {fmtMarketDate(market.endDate)}
          </span>

          {/* Status badge */}
          <div className="flex justify-end pr-2">
            <Badge
              variant="outline"
              className="text-[length:var(--text-tiny)] px-[5px] py-px tracking-[0.06em]"
              style={{ color: status.color, borderColor: status.border, background: status.bg }}
            >
              {status.label}
            </Badge>
          </div>

          {/* Expand chevron */}
          <div className="flex justify-center items-center text-[var(--t4)]">
            <ChevronDown
              size={12}
              className={`${isExpanded ? 'rotate-180' : ''} transition-transform duration-150`}
            />
          </div>
        </Button>
      </CollapsibleTrigger>

      {/* ── Expanded detail panel ── */}
      <CollapsibleContent>
        <div className="bg-[var(--bg-2)] border-b border-b-[var(--bd)] px-[50px] pt-[14px] pb-[18px]">
          <div className="flex gap-7 items-start flex-wrap">

            {/* Chart */}
            <div className="shrink-0">
              {isGroup && (
                <div className="label mb-1.5">
                  CHART: {market.subMarkets.find(s => s.id === selectedSubId)?.groupItemTitle ?? '—'}
                </div>
              )}
              <PriceChart yesTokenId={chartTokenId} />
            </div>

            {/* Description + outcomes */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-[200px]">
              {market.description && (
                <p className="text-[length:var(--text-body-sm)] text-[var(--t3)] leading-[1.7] max-w-[600px]">{market.description}</p>
              )}
              {!isBinary && market.outcomes.length > 0 && (
                <OutcomeList outcomes={market.outcomes} prices={market.prices} />
              )}
            </div>

            {/* Order book + stats */}
            <div className="flex flex-col gap-2.5 items-end min-w-[160px]">
              <OrderBook market={market} />
              <StatGrid market={market} />
              {market.startDate && (
                <div className="text-right">
                  <div className="label">OPENED</div>
                  <span className="mono text-[length:var(--text-label)] text-[var(--t3)]">{fmtMarketDate(market.startDate)}</span>
                </div>
              )}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mono text-[length:var(--text-caption)] tracking-[0.08em] text-[var(--blue-l)] border-[var(--info-bd)] bg-[var(--blue-dim)]"
              >
                <a href={market.polyUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={10} /> POLYMARKET ↗
                </a>
              </Button>
            </div>
          </div>

          {/* Sub-markets */}
          {isGroup && (
            <div className="mt-4 border-t border-t-[var(--bd)] pt-3">
              <div className="label mb-1.5">
                {market.subMarkets.length} SUB-MARKETS — CLICK ROW TO VIEW CHART
              </div>
              <SubMarketTable subMarkets={market.subMarkets} selectedId={selectedSubId} onSelect={setSelectedSubId} />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Private sub-components

function OutcomeList({ outcomes, prices }: { outcomes: string[]; prices: number[] }) {
  return (
    <div className="flex flex-col gap-[5px] max-w-[400px]">
      <div className="label">OUTCOMES</div>
      {outcomes.slice(0, 6).map((outcome, i) => {
        const p = prices[i] ?? 0;
        const c = p >= 0.65 ? 'var(--success)' : p >= 0.5 ? 'var(--blue)' : p >= 0.35 ? 'var(--warning)' : 'var(--danger)';
        return (
          <div key={outcome} className="flex items-center gap-2">
            <span className="mono truncate text-[length:var(--text-label)] text-[var(--t2)] w-[150px] shrink-0">{outcome}</span>
            <Progress
              value={p * 100}
              className="flex-1 h-px max-w-[180px] bg-[var(--bg-3)]"
              indicatorStyle={{ background: c }}
            />
            <span className="mono text-[length:var(--text-label)] font-bold w-8 text-right shrink-0" style={{ color: c }}>
              {Math.round(p * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderBook({ market }: { market: PredictionMarket }) {
  const entries = [
    { label: 'BID',    val: market.bestBid  > 0 ? `${Math.round(market.bestBid * 100)}¢` : '—', color: 'var(--success)' },
    { label: 'ASK',    val: market.bestAsk  > 0 ? `${Math.round(market.bestAsk * 100)}¢` : '—', color: 'var(--danger)'  },
    { label: 'SPREAD', val: market.spread   > 0 ? `${(market.spread * 100).toFixed(1)}¢`  : '—', color: spreadColor(market.spread) },
  ];
  return (
    <div className="text-right w-full">
      <div className="label mb-1">ORDER BOOK</div>
      <div className="flex gap-2.5 justify-end">
        {entries.map(({ label, val, color }) => (
          <div key={label} className="text-right">
            <div className="label text-[length:var(--text-micro)]">{label}</div>
            <span className="mono font-bold" style={{ color }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatGrid({ market }: { market: PredictionMarket }) {
  const rows = [
    { label: 'LIQUIDITY',   val: fmtVol(market.liquidity)  },
    { label: '24H VOL',     val: fmtVol(market.volume24hr) },
    { label: '7D VOL',      val: fmtVol(market.volume1wk)  },
    { label: '1MO VOL',     val: fmtVol(market.volume1mo)  },
    ...(market.openInterest > 0 ? [{ label: 'OPEN INT', val: fmtVol(market.openInterest) }] : []),
    { label: 'COMPETITIVE', val: `${(market.competitive * 100).toFixed(0)}%` },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full">
      {rows.map(({ label, val }) => (
        <div key={label} className="text-right">
          <div className="label text-[length:var(--text-micro)]">{label}</div>
          <span className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--t1)]">{val}</span>
        </div>
      ))}
    </div>
  );
}
