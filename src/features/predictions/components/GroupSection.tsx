'use client';
import { useState } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import type { PredictionMarket } from '@/types/domain';
import type { MarketGroup } from '@/types/domain';

import { MarketRow } from './MarketRow';
import { fmtVol, getLeadProb } from './utils';

type Props = {
  group: MarketGroup;
  markets: PredictionMarket[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  globalRankOffset: number;
  sortBy: 'volume' | 'volume24hr' | 'probability';
};

export function GroupSection({ group, markets, expandedId, onToggle, globalRankOffset, sortBy }: Props) {
  const [open, setOpen] = useState(true);
  if (markets.length === 0) return null;

  const groupVol = markets.reduce((s, m) => s + m.volume, 0);
  const sorted   = [...markets].sort((a, b) => {
    if (sortBy === 'volume')     return b.volume - a.volume;
    if (sortBy === 'volume24hr') return b.volume24hr - a.volume24hr;
    return getLeadProb(b) - getLeadProb(a);
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-[30px] rounded-none flex items-center justify-start px-[14px] gap-2"
          style={{
            background: group.bg,
            borderBottom: `1px solid ${group.border}`,
            borderLeft: `3px solid ${group.color}`,
          }}
        >
          {open
            ? <ChevronDown  size={11} className="shrink-0" style={{ color: group.color }} />
            : <ChevronRight size={11} className="shrink-0" style={{ color: group.color }} />}

          <span className="mono font-bold tracking-[0.10em] text-[length:var(--text-caption)]" style={{ color: group.color }}>
            {group.label}
          </span>
          <span className="mono text-[var(--t4)] tracking-[0.04em] text-[length:var(--text-caption)]">
            {group.description}
          </span>

          <div className="flex items-center gap-3 ml-auto">
            <span className="mono text-[var(--t4)] text-[length:var(--text-caption)]">
              {markets.length} {markets.length === 1 ? 'MARKET' : 'MARKETS'}
            </span>
            <span className="mono text-[var(--t3)] font-bold text-[length:var(--text-caption)]">
              {fmtVol(groupVol)} VOL
            </span>
          </div>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {sorted.map((market, i) => (
          <MarketRow
            key={market.id}
            market={market}
            rank={globalRankOffset + i + 1}
            isExpanded={expandedId === market.id}
            onToggle={() => onToggle(market.id)}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
