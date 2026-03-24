'use client';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type { PredictionMarket,SubMarket } from '@/types/domain';

import { probColor, spreadColor, statusLabel } from './utils';

type Props = {
  subMarkets: SubMarket[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function SubMarketTable({ subMarkets, selectedId, onSelect }: Props) {
  const sorted = [...subMarkets].sort((a, b) => {
    if (a.closed !== b.closed) return a.closed ? 1 : -1;
    return (a.groupItemTitle || a.question).localeCompare(b.groupItemTitle || b.question);
  });

  const HEADERS = ['DATE / QUESTION', 'LAST', 'BID', 'ASK', 'SPREAD', '24H VOL', 'STATUS'];

  return (
    <Table className="w-full mt-1">
      <TableHeader>
        <TableRow className="border-b border-b-[var(--bd)] bg-transparent">
          {HEADERS.map(h => (
            <TableHead
              key={h}
              className={`label h-6 text-[length:var(--text-micro)] py-0 pr-2 pl-1 ${h === 'DATE / QUESTION' ? 'text-left' : 'text-right'}`}
            >
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {sorted.map(sm => {
          const isSelected = sm.id === selectedId;
          const ltpC = probColor(sm.lastTradePrice);
          const sc   = spreadColor(sm.spread);
          const st   = statusLabel(sm as unknown as PredictionMarket);
          const label = sm.groupItemTitle || sm.question.replace(/^Will /i, '').slice(0, 30);

          return (
            <TableRow
              key={sm.id}
              onClick={() => onSelect(sm.id)}
              className={`h-[30px] border-b border-b-[var(--bd)] cursor-pointer transition-colors ${isSelected ? 'bg-[var(--blue-sel)]' : 'hover:bg-[var(--bg-3)]'}`}
              style={{
                borderLeft: isSelected ? '2px solid var(--blue)' : '2px solid transparent',
              }}
            >
              {/* Question */}
              <TableCell
                className="mono truncate max-w-[140px] py-0 pr-2 pl-1 text-[length:var(--text-label)]"
                style={{ color: isSelected ? 'var(--blue-l)' : 'var(--t1)', fontWeight: isSelected ? 700 : 400 }}
              >
                {label}
              </TableCell>
              {/* Last price */}
              <TableCell className="mono text-right px-2 py-0 font-bold" style={{ color: ltpC }}>
                {Math.round(sm.lastTradePrice * 100)}%
              </TableCell>
              {/* Bid */}
              <TableCell className="mono text-right px-2 py-0 text-[var(--t3)] text-[length:var(--text-label)]">
                {sm.bestBid > 0 ? Math.round(sm.bestBid * 100) : '—'}
              </TableCell>
              {/* Ask */}
              <TableCell className="mono text-right px-2 py-0 text-[var(--t3)] text-[length:var(--text-label)]">
                {sm.bestAsk > 0 ? Math.round(sm.bestAsk * 100) : '—'}
              </TableCell>
              {/* Spread */}
              <TableCell className="mono text-right px-2 py-0 text-[length:var(--text-label)]" style={{ color: sc }}>
                {sm.spread > 0 ? (sm.spread * 100).toFixed(1) : '—'}
              </TableCell>
              {/* 24h volume */}
              <TableCell
                className="mono text-right px-2 py-0 text-[length:var(--text-label)]"
                style={{ color: sm.volume24hr > 0 ? 'var(--success)' : 'var(--t4)' }}
              >
                {sm.volume24hr > 0 ? `$${(sm.volume24hr / 1000).toFixed(0)}K` : '—'}
              </TableCell>
              {/* Status */}
              <TableCell className="text-right px-1 py-0">
                <Badge
                  variant="outline"
                  className="text-[length:var(--text-micro)] px-1 py-px tracking-[0.06em]"
                  style={{ color: st.color, borderColor: st.border, background: st.bg }}
                >
                  {st.label}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
