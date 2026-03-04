'use client';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IntelTabBar, TabsContent } from '@/components/shared/IntelTabs';
import { SectionDivider } from '@/components/shared/SectionDivider';
import XPostCard from '@/components/shared/XPostCard';
import { useXPostsByEvent } from '@/api/x-posts';
import type { IntelEvent, XPost } from '@/types/domain';
import { SEV_C } from '@/lib/severity-colors';
import { cn } from '@/lib/utils';
const TIER_C: Record<number, string> = { 1: 'var(--success)', 2: 'var(--warning)', 3: 'var(--t4)' };
const TIER_L: Record<number, string> = { 1: 'T1', 2: 'T2', 3: 'T3' };
const STANCE_C: Record<string, string> = {
  SUPPORTING: 'var(--success)', OPPOSING: 'var(--danger)',
  NEUTRAL: 'var(--t4)', UNKNOWN: 'var(--t4)',
};

function MetaChip({ label, val }: { label: string; val: string }) {
  return (
    <div>
      <div className="label text-[8px] mb-px">{label}</div>
      <span className="mono text-[10px] text-[var(--t1)]">{val}</span>
    </div>
  );
}

interface Props {
  event: IntelEvent;
  tab: 'report' | 'signals';
  onTabChange: (t: 'report' | 'signals') => void;
  compact?: boolean;
  pageScroll?: boolean;
}

export function EventDetail({ event, tab, onTabChange, compact = false, pageScroll = false }: Props) {
  const sc     = SEV_C[event.severity] ?? 'var(--info)';
  const { data: xPosts = [] } = useXPostsByEvent(undefined, event.id);

  const tabs = [
    { value: 'report'  as const, label: 'INTEL REPORT' },
    { value: 'signals' as const, label: `𝕏 SIGNALS${xPosts.length > 0 ? ` (${xPosts.length})` : ''}` },
  ];

  return (
    <div className={cn(pageScroll ? 'flex flex-col' : 'flex-1 flex flex-col overflow-hidden')}>
      {/* Header */}
      <div className={cn('border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0', compact ? 'px-3 py-2' : 'px-5 py-2.5')}>
        <div className="flex gap-2 mb-2 flex-wrap items-center">
          <div
            className="flex items-center gap-[5px] px-2 py-0.5"
            style={{ border: `1px solid ${sc}`, background: sc + '18' }}
          >
            <div className="w-[5px] h-[5px] rounded-full" style={{ background: sc }} />
            <span className="text-[9px] font-bold tracking-[0.08em]" style={{ color: sc }}>
              {event.severity}
            </span>
          </div>
          <span className="label text-[8px] text-[var(--t3)]">{event.type}</span>
          {event.verified && (
            <div className="flex items-center gap-[3px]">
              <CheckCircle size={9} className="text-[var(--success)]" strokeWidth={2} />
              <span className="label text-[8px] text-[var(--success)]">VERIFIED</span>
            </div>
          )}
        </div>
        <h1 className={cn('font-bold text-[var(--t1)] leading-[1.25] mb-2', compact ? 'text-[13px]' : 'text-[15px]')}>
          {event.title}
        </h1>
        <div className="flex gap-5">
          <MetaChip label="TIMESTAMP"
            val={new Date(event.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'} />
          <MetaChip label="LOCATION" val={event.location} />
          <MetaChip label="SOURCES"  val={String(event.sources.length)} />
        </div>
      </div>

      {/* Tabs */}
      <IntelTabBar value={tab} onValueChange={onTabChange} tabs={tabs} compact={compact}>
        <TabsContent value="report" className={pageScroll ? '' : 'flex-1 min-h-0 overflow-hidden'}>
          {pageScroll ? (
            <div className={cn(compact ? 'px-3 py-3' : 'px-6 py-5')}>
              <div className="mb-[22px]">
                <SectionDivider label="EXECUTIVE SUMMARY" />
                <div className="pl-[14px]" style={{ borderLeft: `3px solid ${sc}` }}>
                  <p className="text-[13px] text-[var(--t1)] leading-relaxed">{event.summary}</p>
                </div>
              </div>

              <div className="mb-[22px]">
                <SectionDivider label="INTELLIGENCE REPORT" />
                <div className="text-[12.5px] text-[var(--t1)] leading-relaxed">
                  {event.fullContent.split('\n\n').map((p, i) => (
                    <p key={i} className={`mb-3 ${i === 0 ? 'text-[var(--t1)]' : 'text-[var(--t2)]'}`}>{p}</p>
                  ))}
                </div>
              </div>

              <div className="mb-[22px]">
                <SectionDivider label={`SOURCES (${event.sources.length})`} />
                <div className="flex flex-col gap-1">
                  {event.sources.map((src, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5 border border-[var(--bd)]" style={src.url ? { borderColor: 'color-mix(in srgb, var(--blue) 30%, var(--bd))' } : undefined}>
                      <span
                        className="text-[8px] font-bold px-[5px] py-px shrink-0"
                        style={{ background: TIER_C[src.tier] + '22', color: TIER_C[src.tier] }}
                      >
                        {TIER_L[src.tier]}
                      </span>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] flex-1 font-medium hover:underline"
                          style={{ color: 'var(--blue-l)', textDecoration: 'none' }}
                        >
                          {src.name} ↗
                        </a>
                      ) : (
                        <span className="text-[11px] text-[var(--t1)] flex-1">{src.name}</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="w-[50px] h-[3px] bg-[var(--bd)]">
                          <div
                            className="h-full"
                            style={{
                              width: `${src.reliability}%`,
                              background: src.reliability > 90 ? 'var(--success)'
                                : src.reliability > 75 ? 'var(--warning)' : 'var(--danger)',
                            }}
                          />
                        </div>
                        <span className="mono text-[9px] text-[var(--t3)] min-w-[26px]">
                          {src.reliability}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {event.actorResponses.length > 0 && (
                <div className="mb-[22px]">
                  <SectionDivider label="ACTOR RESPONSES" />
                  <div className="flex flex-col gap-1.5">
                    {event.actorResponses.map((r, i) => {
                      const stC = STANCE_C[r.stance] ?? 'var(--t2)';
                      return (
                        <Link key={i} href={`/dashboard/actors?actor=${r.actorId}`} className="no-underline">
                          <div
                            className="px-3 py-2 border border-[var(--bd)] cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
                            style={{ borderLeft: `3px solid ${stC}` }}
                          >
                            <div className="flex gap-2 mb-1">
                              <span className="text-[11px] font-bold text-[var(--t1)]">{r.actorName}</span>
                              <span
                                className="text-[8px] px-[5px] py-px font-bold tracking-[0.05em]"
                                style={{ background: stC + '18', color: stC }}
                              >{r.stance}</span>
                              <span className="label text-[8px] ml-auto text-[var(--t3)]">{r.type}</span>
                              <ArrowRight size={9} className="text-[var(--t3)]" strokeWidth={1.5} />
                            </div>
                            <p className="text-[11.5px] text-[var(--t2)] leading-[1.5] italic">
                              &quot;{r.statement}&quot;
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className={cn(compact ? 'px-3 py-3' : 'px-6 py-5')}>
                <div className="mb-[22px]">
                  <SectionDivider label="EXECUTIVE SUMMARY" />
                  <div className="pl-[14px]" style={{ borderLeft: `3px solid ${sc}` }}>
                    <p className="text-[13px] text-[var(--t1)] leading-relaxed">{event.summary}</p>
                  </div>
                </div>

                <div className="mb-[22px]">
                  <SectionDivider label="INTELLIGENCE REPORT" />
                  <div className="text-[12.5px] text-[var(--t1)] leading-relaxed">
                    {event.fullContent.split('\n\n').map((p, i) => (
                      <p key={i} className={`mb-3 ${i === 0 ? 'text-[var(--t1)]' : 'text-[var(--t2)]'}`}>{p}</p>
                    ))}
                  </div>
                </div>

                <div className="mb-[22px]">
                  <SectionDivider label={`SOURCES (${event.sources.length})`} />
                  <div className="flex flex-col gap-1">
                    {event.sources.map((src, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5 border border-[var(--bd)]" style={src.url ? { borderColor: 'color-mix(in srgb, var(--blue) 30%, var(--bd))' } : undefined}>
                        <span
                          className="text-[8px] font-bold px-[5px] py-px shrink-0"
                          style={{ background: TIER_C[src.tier] + '22', color: TIER_C[src.tier] }}
                        >
                          {TIER_L[src.tier]}
                        </span>
                        {src.url ? (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] flex-1 font-medium hover:underline"
                            style={{ color: 'var(--blue-l)', textDecoration: 'none' }}
                          >
                            {src.name} ↗
                          </a>
                        ) : (
                          <span className="text-[11px] text-[var(--t1)] flex-1">{src.name}</span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <div className="w-[50px] h-[3px] bg-[var(--bd)]">
                            <div
                              className="h-full"
                              style={{
                                width: `${src.reliability}%`,
                                background: src.reliability > 90 ? 'var(--success)'
                                  : src.reliability > 75 ? 'var(--warning)' : 'var(--danger)',
                              }}
                            />
                          </div>
                          <span className="mono text-[9px] text-[var(--t3)] min-w-[26px]">
                            {src.reliability}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {event.actorResponses.length > 0 && (
                  <div className="mb-[22px]">
                    <SectionDivider label="ACTOR RESPONSES" />
                    <div className="flex flex-col gap-1.5">
                      {event.actorResponses.map((r, i) => {
                        const stC = STANCE_C[r.stance] ?? 'var(--t2)';
                        return (
                          <Link key={i} href={`/dashboard/actors?actor=${r.actorId}`} className="no-underline">
                            <div
                              className="px-3 py-2 border border-[var(--bd)] cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
                              style={{ borderLeft: `3px solid ${stC}` }}
                            >
                              <div className="flex gap-2 mb-1">
                                <span className="text-[11px] font-bold text-[var(--t1)]">{r.actorName}</span>
                                <span
                                  className="text-[8px] px-[5px] py-px font-bold tracking-[0.05em]"
                                  style={{ background: stC + '18', color: stC }}
                                >{r.stance}</span>
                                <span className="label text-[8px] ml-auto text-[var(--t3)]">{r.type}</span>
                                <ArrowRight size={9} className="text-[var(--t3)]" strokeWidth={1.5} />
                              </div>
                              <p className="text-[11.5px] text-[var(--t2)] leading-[1.5] italic">
                                &quot;{r.statement}&quot;
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="signals" className={pageScroll ? '' : 'flex-1 min-h-0 overflow-hidden'}>
          {pageScroll ? (
            <div className={cn(compact ? 'px-3 py-3' : 'px-4 py-3')}>
              {xPosts.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-xl text-[var(--t3)]">𝕏</span>
                  <p className="label text-[var(--t3)] mt-2">
                    No signals indexed for this event
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-2.5">
                    <span className="label text-[8px]">
                      {xPosts.length} POSTS · PHAROS-CURATED · CHRONOLOGICAL
                    </span>
                  </div>
                  {xPosts.map(p => <XPostCard key={p.id} post={p as XPost} />)}
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className={cn(compact ? 'px-3 py-3' : 'px-4 py-3')}>
                {xPosts.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="text-xl text-[var(--t3)]">𝕏</span>
                    <p className="label text-[var(--t3)] mt-2">
                      No signals indexed for this event
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-2.5">
                      <span className="label text-[8px]">
                        {xPosts.length} POSTS · PHAROS-CURATED · CHRONOLOGICAL
                      </span>
                    </div>
                    {xPosts.map(p => <XPostCard key={p.id} post={p as XPost} />)}
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </IntelTabBar>
    </div>
  );
}
