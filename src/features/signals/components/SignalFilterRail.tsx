'use client';
import { ScrollArea } from '@/components/ui/scroll-area';

import { DaySelector } from '@/shared/components/shared/DaySelector';
import { CheckboxRow, FilterBlock, ToggleRow } from '@/shared/components/shared/FilterControls';

import { cn } from '@/shared/lib/utils';

import type { AccountType, ConflictDay, Significance, VerificationStatus } from '@/types/domain';
export type { AccountType, Significance, VerificationStatus };

const SIG_LABELS: Significance[] = ['BREAKING', 'HIGH', 'STANDARD'];
const ACCT_LABELS: AccountType[] = ['military', 'government', 'journalist', 'analyst'];
const SIG_C: Record<Significance, string> = {
  BREAKING: 'var(--danger)', HIGH: 'var(--warning)', STANDARD: 'var(--info)',
};

const VERIFICATION_LABELS: { key: string; label: string; color: string }[] = [
  { key: 'VERIFIED', label: 'VERIFIED', color: 'var(--success)' },
  { key: 'PARTIAL',  label: 'PARTIAL',  color: 'var(--warning)' },
  { key: 'UNVERIFIED', label: 'UNVERIFIED', color: 'var(--t4)' },
];

type Props = {
  sigFilter:    Record<Significance, boolean>;
  acctFilter:   Record<AccountType, boolean>;
  pharosOnly:   boolean;
  verifiedOnly: boolean;
  totalShown:   number;
  totalAll:     number;
  lastUpdated?: string;
  onSigChange:  (s: Significance, v: boolean) => void;
  onAcctChange: (a: AccountType, v: boolean) => void;
  onPharosOnly: (v: boolean) => void;
  onVerifiedOnly: (v: boolean) => void;
  currentDay:   ConflictDay;
  onDayChange:  (day: ConflictDay) => void;
  showAll:      boolean;
  onAllClick:   () => void;
  compact?: boolean;
  pageScroll?: boolean;
};

export function SignalFilterRail({
  sigFilter, acctFilter, pharosOnly, verifiedOnly, totalShown, totalAll, lastUpdated,
  onSigChange, onAcctChange, onPharosOnly, onVerifiedOnly,
  currentDay, onDayChange, showAll, onAllClick,
  compact = false, pageScroll = false,
}: Props) {
  const body = (
    <>
      <FilterBlock label="CONFLICT DAY">
        <div className={cn(pageScroll ? 'safe-px' : 'px-3', 'py-1')}>
          <DaySelector
            currentDay={currentDay}
            onDayChange={onDayChange}
            showAll
            allSelected={showAll}
            onAllClick={onAllClick}
          />
        </div>
      </FilterBlock>
      <FilterBlock label="SIGNIFICANCE">
        {SIG_LABELS.map(s => (
          <CheckboxRow key={s} label={s} color={SIG_C[s]}
            checked={sigFilter[s]} onChange={v => onSigChange(s, v)} />
        ))}
      </FilterBlock>
      <FilterBlock label="ACCOUNT TYPE">
        {ACCT_LABELS.map(a => (
          <CheckboxRow key={a} label={a.toUpperCase()} color="var(--info)"
            checked={acctFilter[a]} onChange={v => onAcctChange(a, v)} />
        ))}
      </FilterBlock>
      <FilterBlock label="VERIFICATION">
        <ToggleRow label="Verified only" checked={verifiedOnly} onChange={onVerifiedOnly} />
      </FilterBlock>
      <FilterBlock label="ANALYST NOTES">
        <ToggleRow label="Pharos notes only" checked={pharosOnly} onChange={onPharosOnly} />
      </FilterBlock>
    </>
  );

  return (
    <div className={cn(pageScroll ? 'flex flex-col' : 'flex-1 flex flex-col overflow-hidden')}>
      <div className={cn('panel-header', compact && (pageScroll ? 'h-8 min-h-8 safe-px' : 'h-8 min-h-8 px-3'))}>
        <span className="text-[length:var(--text-body)] text-[var(--t1)] leading-none">𝕏</span>
        <span className="section-title">Signal Filters</span>
      </div>
      {pageScroll ? body : <ScrollArea className="flex-1">{body}</ScrollArea>}
      <div className={cn(pageScroll ? 'safe-px' : 'px-3', 'py-2 border-t border-[var(--bd)] shrink-0')}>
        <span className="mono text-[length:var(--text-caption)] text-[var(--t3)] block">
          {totalShown} / {totalAll} SIGNALS
        </span>
        {lastUpdated && (
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] block mt-1">
            LAST UPDATED {lastUpdated}
          </span>
        )}
      </div>
    </div>
  );
}
