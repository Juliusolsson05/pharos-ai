'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { ArrowRight, BookOpen, Map as MapIcon, TrendingUp, Users, Zap } from 'lucide-react';

import { useActors } from '@/features/actors/queries';
import { CasChip } from '@/features/dashboard/components/CasChip';
import { useBootstrap } from '@/features/dashboard/queries';
import { useConflictDays } from '@/features/dashboard/queries/conflicts';
import { useEvents } from '@/features/events/queries';
import { useXPosts } from '@/features/events/queries/x-posts';
import { useMapStories } from '@/features/map/queries';
import { XPostCard } from '@/shared/components/shared/XPostCard';

import { getConflictForDay, getEventsForDay, getPostsForDay } from '@/shared/lib/day-filter';
import { fmtTimeZ } from '@/shared/lib/format';
import { SEV_C } from '@/shared/lib/severity-colors';

import type { XPost } from '@/types/domain';

const SEV_CLS: Record<string, string> = {
  CRITICAL: 'sev sev-crit', HIGH: 'sev sev-high', STANDARD: 'sev sev-std',
};

export function MobileOverview() {
  const { data: bootstrap } = useBootstrap();
  const { data: snapshots } = useConflictDays();
  const { data: allEvents } = useEvents();
  const { data: actors } = useActors();
  const { data: xPosts } = useXPosts();
  const { data: stories = [] } = useMapStories();

  const allDays = useMemo(() => bootstrap?.days ?? [], [bootstrap]);
  const latestDay = allDays[allDays.length - 1] ?? '';
  const snap = snapshots ? getConflictForDay(snapshots, latestDay) : null;

  const recentEvents = useMemo(() => {
    if (!allEvents) return [];
    return getEventsForDay(allEvents, allDays, latestDay)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [allEvents, allDays, latestDay]);

  const breakingSignals = useMemo(() => {
    if (!xPosts) return [];
    return getPostsForDay(xPosts, allDays, latestDay)
      .filter(p => p.significance === 'BREAKING')
      .slice(0, 3);
  }, [xPosts, allDays, latestDay]);

  const totalEvents = allEvents?.length ?? 0;
  const totalActors = actors?.length ?? 0;
  const totalStories = stories.length;
  const critCount = recentEvents.filter(e => e.severity === 'CRITICAL').length;
  const [expandedSummary, setExpandedSummary] = useState(false);
  const feedHref = (eventId?: string) => {
    const params = new URLSearchParams();
    if (latestDay) params.set('day', latestDay);
    if (eventId) params.set('event', eventId);
    const qs = params.toString();
    return qs ? `/dashboard/feed?${qs}` : '/dashboard/feed';
  };
  const mapHref = (storyId?: string) => {
    const params = new URLSearchParams();
    if (storyId) params.set('story', storyId);
    const qs = params.toString();
    return qs ? `/dashboard/map?${qs}` : '/dashboard/map';
  };
  const actorsHref = latestDay ? `/dashboard/actors?day=${latestDay}` : '/dashboard/actors';
  const briefHref = latestDay ? `/dashboard/brief?day=${latestDay}` : '/dashboard/brief';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-1)] safe-pb">

      {/* ── Situation summary ── */}
      {snap && (
        <div className="safe-px py-3 border-b border-[var(--bd)]">
          <div className="mono text-[8px] text-[var(--t4)] tracking-[0.10em] mb-1">
            {snap.dayLabel} — SITUATION
          </div>
          <p
            className={`text-xs text-[var(--t2)] leading-relaxed cursor-pointer ${expandedSummary ? '' : 'line-clamp-3'}`}
            onClick={() => setExpandedSummary(p => !p)}
          >{snap.summary}</p>

          {/* Escalation */}
          <div className="flex items-center gap-3 mt-2.5">
            <span className="mono text-[8px] text-[var(--t4)]">ESCALATION</span>
            <div className="flex-1 h-[4px] bg-[var(--bg-3)] rounded-sm overflow-hidden">
              <div className="h-full bg-[var(--danger)] rounded-sm" style={{ width: `${snap.escalation}%` }} />
            </div>
            <span className="mono text-xs font-bold text-[var(--danger)]">{snap.escalation}</span>
          </div>

          {/* Casualty chips */}
          <div className="flex gap-2 mt-2.5 flex-wrap">
            <CasChip label="US KIA" val={String(snap.casualties.us.kia)} color="var(--danger)" />
            <CasChip label="IL Civ" val={String(snap.casualties.israel.civilians)} color="var(--warning)" />
            <CasChip label="IR Killed" val={String(snap.casualties.iran.killed)} color="var(--t2)" />
          </div>
        </div>
      )}

      {/* ── GO TO MAP hero ── */}
      <Link href={mapHref()} className="no-underline">
        <div className="safe-px my-3 py-4 bg-[var(--blue-dim)] border border-[var(--blue)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapIcon size={20} strokeWidth={2} className="text-[var(--blue-l)]" />
            <div>
              <span className="mono text-xs font-bold text-[var(--blue-l)] tracking-[0.06em]">OPEN LIVE MAP</span>
              <p className="mono text-[9px] text-[var(--t3)] mt-0.5">{totalStories} stories · {totalEvents} events tracked</p>
            </div>
          </div>
          <ArrowRight size={18} strokeWidth={2} className="text-[var(--blue-l)]" />
        </div>
      </Link>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-4 gap-px safe-px mb-3 bg-[var(--bd)]">
        {[
          { label: 'EVENTS', val: totalEvents, icon: Zap, color: 'var(--blue)' },
          { label: 'CRITICAL', val: critCount, icon: Zap, color: 'var(--danger)' },
          { label: 'ACTORS', val: totalActors, icon: Users, color: 'var(--teal)' },
          { label: 'STORIES', val: totalStories, icon: BookOpen, color: 'var(--info)' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--bg-2)] px-2 py-2.5 flex flex-col items-center gap-1">
            <span className="mono text-base font-bold" style={{ color: s.color }}>{s.val}</span>
            <span className="mono text-[7px] text-[var(--t4)] tracking-[0.08em]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Latest events ── */}
      <div className="border-t border-[var(--bd)]">
        <div className="flex items-center justify-between safe-px py-2 bg-[var(--bg-2)] border-b border-[var(--bd)]">
          <span className="section-title">Latest Events</span>
          <Link href={feedHref()} className="no-underline flex items-center gap-1">
            <span className="mono text-[9px] text-[var(--blue-l)] font-bold">See all</span>
            <ArrowRight size={10} className="text-[var(--blue-l)]" />
          </Link>
        </div>
        {recentEvents.map((evt, i) => {
          const sc = SEV_C[evt.severity] ?? 'var(--info)';
          return (
            <Link key={evt.id} href={feedHref(evt.id)} className="no-underline">
              <div
                className="flex gap-2.5 items-start safe-px py-2 hover:bg-[var(--bg-3)] transition-colors"
                style={{
                  borderBottom: i < recentEvents.length - 1 ? '1px solid var(--bd-s)' : 'none',
                  borderLeft: `3px solid ${sc}`,
                }}
              >
                <div className="shrink-0 w-14">
                  <span className={SEV_CLS[evt.severity]}>{evt.severity.slice(0, 4)}</span>
                  <div className="mono text-[8px] text-[var(--t4)] mt-0.5">{fmtTimeZ(evt.timestamp)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--t1)] leading-snug">{evt.title}</p>
                  <span className="mono text-[8px] text-[var(--t4)]">{evt.location}</span>
                </div>
                <ArrowRight size={10} className="text-[var(--t4)] shrink-0 mt-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Active stories ── */}
      {stories.length > 0 && (
        <div className="border-t border-[var(--bd)] mt-0">
          <div className="flex items-center justify-between safe-px py-2 bg-[var(--bg-2)] border-b border-[var(--bd)]">
            <span className="section-title">Active Stories</span>
            <Link href={mapHref()} className="no-underline flex items-center gap-1">
              <span className="mono text-[9px] text-[var(--blue-l)] font-bold">Map</span>
              <ArrowRight size={10} className="text-[var(--blue-l)]" />
            </Link>
          </div>
          {stories.slice(0, 3).map((story, i) => {
            const catColor: Record<string, string> = {
              STRIKE: 'var(--danger)', RETALIATION: 'var(--warning)',
              NAVAL: 'var(--blue)', INTEL: 'var(--cyber)', DIPLOMATIC: 'var(--teal)',
            };
            const c = catColor[story.category] ?? 'var(--t3)';
            return (
              <Link key={story.id} href={mapHref(story.id)} className="no-underline">
                <div
                  className="flex gap-2.5 items-start safe-px py-2.5 hover:bg-[var(--bg-3)] transition-colors"
                  style={{
                    borderBottom: i < 2 ? '1px solid var(--bd-s)' : 'none',
                    borderLeft: `3px solid ${c}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="mono text-[7px] font-bold tracking-[0.06em] px-[4px] py-[1px]"
                        style={{ color: c, background: c + '18', border: `1px solid ${c}40` }}
                      >
                        {story.category}
                      </span>
                      <span className="mono text-[8px] text-[var(--t4)]">{fmtTimeZ(story.timestamp)}</span>
                    </div>
                    <p className="text-[11px] font-bold text-[var(--t1)] leading-snug">{story.title}</p>
                    <p className="text-[10px] text-[var(--t3)] leading-snug mt-0.5">{story.tagline}</p>
                  </div>
                  <ArrowRight size={10} className="text-[var(--t4)] shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Breaking signals ── */}
      {breakingSignals.length > 0 && (
        <div className="border-t border-[var(--bd)]">
          <div className="flex items-center justify-between safe-px py-2 bg-[var(--bg-2)] border-b border-[var(--bd)]">
            <span className="section-title">Breaking Signals</span>
            <Link href="/dashboard/signals" className="no-underline flex items-center gap-1">
              <span className="mono text-[9px] text-[var(--blue-l)] font-bold">All signals</span>
              <ArrowRight size={10} className="text-[var(--blue-l)]" />
            </Link>
          </div>
          <div className="safe-px py-2">
            {breakingSignals.map(p => (
              <XPostCard key={p.id} post={p as XPost} compact />
            ))}
          </div>
        </div>
      )}

      {/* ── Nav links to other pages ── */}
      <div className="border-t border-[var(--bd)] safe-px py-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: actorsHref, label: 'ACTORS', icon: Users, color: 'var(--teal)' },
            { href: '/dashboard/predictions', label: 'PREDICTIONS', icon: TrendingUp, color: 'var(--warning)' },
            { href: briefHref, label: 'BRIEF', icon: BookOpen, color: 'var(--info)' },
          ].map(nav => (
            <Link key={nav.href} href={nav.href} className="no-underline">
              <div className="flex items-center gap-2.5 px-3 py-3 border border-[var(--bd)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] transition-colors">
                <nav.icon size={14} strokeWidth={2} style={{ color: nav.color }} />
                <span className="mono text-[10px] font-bold text-[var(--t2)] tracking-[0.06em]">{nav.label}</span>
                <ArrowRight size={10} className="text-[var(--t4)] ml-auto" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-4" />
    </div>
  );
}
