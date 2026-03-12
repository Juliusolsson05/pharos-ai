'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import { ArrowLeft, ArrowRight, Plus,X as XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ResizableHandle,ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

import { useActors } from '@/features/actors/queries';
import { useBootstrap } from '@/features/dashboard/queries';
import { useConflict, useConflictDays } from '@/features/dashboard/queries/conflicts';
import { ALL_WIDGET_KEYS, PRESETS, WIDGET_LABELS, type WidgetKey } from '@/features/dashboard/state/presets';
import {
  addColumn as addColumnAction,
  addWidget as addWidgetAction,
  applyPreset,
  moveWidget as moveWidgetAction,
  removeWidget as removeWidgetAction,
  resetToPreset,
  setColumnSizes,
  setRowSizes,
  toggleEditing,
} from '@/features/dashboard/state/workspace-slice';
import { useEvents } from '@/features/events/queries';
import { useXPosts } from '@/features/events/queries/x-posts';
import { MobileOverviewSkeleton, OverviewScreenSkeleton } from '@/shared/components/loading/screen-skeletons';
import { DaySelector } from '@/shared/components/shared/DaySelector';

import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

import type { DashData } from './DashCtx';
import { DashCtx } from './DashCtx';
import { MobileOverview } from './MobileOverview';
import { widgetComponents } from './widgets';

import { useAppDispatch,useAppSelector } from '@/shared/state';

const WIDGET_LINKS: Partial<Record<WidgetKey, { href: string; label: string; preserveDay?: boolean }>> = {
  latest:      { href: '/dashboard/feed',        label: 'View All', preserveDay: true },
  actors:      { href: '/dashboard/actors',      label: 'Dossiers', preserveDay: true },
  signals:     { href: '/dashboard/signals',     label: 'All Signals' },
  map:         { href: '/dashboard/map',         label: 'Full Map' },
  predictions: { href: '/dashboard/predictions', label: 'All Markets' },
  brief:       { href: '/dashboard/brief',       label: 'Full Brief', preserveDay: true },
};

export function WorkspaceDashboard() {
  const dispatch = useAppDispatch();
  const { columns, activePreset, editing, columnSizes, rowSizes } = useAppSelector(s => s.workspace);
  const isMobile = useIsMobile(1024);
  const isLandscapePhone = useIsLandscapePhone();

  const { data: bootstrap, isLoading: bootstrapLoading } = useBootstrap();
  const allDays = bootstrap?.days ?? [];
  const [dashDay, setDashDay] = useState<string>('');
  const effectiveDashDay = dashDay || allDays[allDays.length - 1] || '';
  const widgetLinks = Object.fromEntries(
    Object.entries(WIDGET_LINKS).map(([key, value]) => {
      const href = effectiveDashDay && value!.preserveDay
        ? `${value!.href}?day=${effectiveDashDay}`
        : value!.href;
      return [key, { ...value!, href }];
    }),
  ) as typeof WIDGET_LINKS;

  const { data: conflict, isLoading: conflictLoading } = useConflict();
  const { data: snapshots, isLoading: snapshotsLoading } = useConflictDays();
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: actors, isLoading: actorsLoading } = useActors(undefined, effectiveDashDay || undefined);
  const { data: xPosts, isLoading: postsLoading } = useXPosts();
  const isDashboardLoading = bootstrapLoading || conflictLoading || snapshotsLoading || eventsLoading || actorsLoading || postsLoading;

  const usedWidgets = columns.flatMap(c => c.widgets);
  const availableWidgets = ALL_WIDGET_KEYS.filter(k => !usedWidgets.includes(k));
  const colSize = `${(100 / columns.length).toFixed(1)}%`;

  const dashData: DashData = {
    day: effectiveDashDay,
    conflict: conflict ?? null,
    snapshots: snapshots ?? [],
    events: events ?? [],
    actors: actors ?? [],
    xPosts: xPosts ?? [],
    allDays,
  };

  if (isMobile || isLandscapePhone) {
    if (isDashboardLoading) return <MobileOverviewSkeleton />;
    return <MobileOverview />;
  }

  if (isDashboardLoading) return <OverviewScreenSkeleton />;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--bg-1)] overflow-hidden">
      {/* ── toolbar ── */}
      <div className="shrink-0 flex items-center gap-2 py-1 px-3 border-b border-[var(--bd)] bg-[var(--bg-2)] overflow-x-auto touch-scroll hide-scrollbar">
        <Button
          variant={editing ? 'outline' : 'ghost'}
          size="xs"
          onClick={() => dispatch(toggleEditing())}
          className={`text-[10px] font-semibold tracking-wide mono ${
            editing
              ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]'
              : 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t3)]'
          }`}
        >
          {editing ? '✦ EDITING' : 'EDIT LAYOUT'}
        </Button>

        {/* preset selector */}
        <div className="flex items-center gap-0.5 ml-2">
          {(['analyst', 'commander', 'executive'] as const).map(id => (
            <Button
              key={id}
              variant={activePreset === id ? 'outline' : 'ghost'}
              size="xs"
              onClick={() => dispatch(applyPreset(id))}
              className={`text-[10px] font-semibold tracking-wide mono ${
                activePreset === id
                  ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]'
                  : 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t4)] hover:text-[var(--t2)]'
              }`}
            >
              {PRESETS[id].label}
            </Button>
          ))}
          {activePreset === 'custom' && (
            <span className="text-[9px] text-[var(--t4)] ml-1 mono">CUSTOM</span>
          )}
        </div>

        <div className="ml-1">
          <DaySelector currentDay={effectiveDashDay} onDayChange={setDashDay} />
        </div>

        {editing && (
          <>
            {availableWidgets.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  id="add-widget-select"
                  className="text-[10px] px-2 py-1 border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)]"
                  defaultValue=""
                  onChange={() => {}}
                >
                  <option value="" disabled>widget</option>
                  {availableWidgets.map(k => (
                    <option key={k} value={k}>{WIDGET_LABELS[k]}</option>
                  ))}
                </select>
                <span className="text-[9px] text-[var(--t4)]">→ col:</span>
                {columns.map((col, ci) => (
                  <Button
                    key={col.id}
                    variant="ghost"
                    size="xs"
                    className="text-[10px] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)]"
                    onClick={() => {
                      const sel = document.getElementById('add-widget-select') as HTMLSelectElement;
                      const val = sel.value as WidgetKey;
                      if (!val || !availableWidgets.includes(val)) return;
                      dispatch(addWidgetAction({ colId: col.id, widget: val }));
                      sel.value = '';
                    }}
                  >
                    {ci + 1}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-[10px] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)]"
                  onClick={() => {
                    const sel = document.getElementById('add-widget-select') as HTMLSelectElement;
                    const val = sel.value as WidgetKey;
                    if (!val || !availableWidgets.includes(val)) return;
                    dispatch(addColumnAction(val));
                    sel.value = '';
                  }}
                >
                  <Plus size={9} strokeWidth={2.5} />
                  col
                </Button>
              </div>
            )}
            <span className="text-[9px] text-[var(--t4)] mono ml-2">drag splitters to resize</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => dispatch(resetToPreset())}
              className="ml-auto text-[10px] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t4)]"
            >
              Reset
            </Button>
          </>
        )}
      </div>

      {/* ── tiled layout ── */}
      <DashCtx.Provider value={dashData}>
        <ResizablePanelGroup
          orientation="horizontal"
          id="workspace-cols"
          className="flex-1 min-h-0"
          onLayoutChanged={(layout) => { dispatch(setColumnSizes(layout)); }}
        >
          {columns.map((col, ci) => (
            <React.Fragment key={col.id}>
              {ci > 0 && <ResizableHandle />}
              <ResizablePanel
                id={col.id}
                defaultSize={columnSizes[col.id] != null ? `${columnSizes[col.id]}%` : colSize}
                minSize="10%"
                className="flex flex-col min-h-0 min-w-0 overflow-hidden"
              >
                <ResizablePanelGroup
                  orientation="vertical"
                  id={`rows-${col.id}`}
                  className="flex-1 min-h-0"
                  onLayoutChanged={(layout) => { dispatch(setRowSizes({ colId: col.id, layout })); }}
                >
                  {col.widgets.map((widget, wi) => (
                    <React.Fragment key={`${col.id}-${widget}`}>
                      {wi > 0 && <ResizableHandle />}
                      <ResizablePanel
                        id={`${col.id}-${widget}`}
                        defaultSize={rowSizes[col.id]?.[`${col.id}-${widget}`] != null ? `${rowSizes[col.id][`${col.id}-${widget}`]}%` : `${(100 / col.widgets.length).toFixed(1)}%`}
                        minSize="15%"
                        className="flex flex-col min-h-0 overflow-hidden"
                      >
                        <div className="flex flex-col h-full min-h-0 overflow-hidden">
                          <div
                            className="panel-header shrink-0"
                            style={editing ? { borderBottom: '1px solid var(--blue-dim)' } : undefined}
                          >
                            <span className="section-title">{WIDGET_LABELS[widget]}</span>

                            {editing && (
                              <div className="ml-auto flex items-center gap-1">
                                {ci > 0 && (
                                  <Button variant="ghost" size="icon-sm" title="Move left"
                                    onClick={() => dispatch(moveWidgetAction({ colId: col.id, widget, direction: 'left' }))}
                                  >
                                    <ArrowLeft size={10} strokeWidth={2} />
                                  </Button>
                                )}
                                {ci < columns.length - 1 && (
                                  <Button variant="ghost" size="icon-sm" title="Move right"
                                    onClick={() => dispatch(moveWidgetAction({ colId: col.id, widget, direction: 'right' }))}
                                  >
                                    <ArrowRight size={10} strokeWidth={2} />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon-sm" title="Remove widget"
                                  className="hover:text-[var(--danger)]"
                                  onClick={() => dispatch(removeWidgetAction({ colId: col.id, widget }))}
                                >
                                  <XIcon size={10} strokeWidth={2} />
                                </Button>
                              </div>
                            )}

                            {!editing && widgetLinks[widget] && (
                              <Link href={widgetLinks[widget]!.href} className="no-underline ml-auto flex items-center gap-1">
                                <span className="text-[9px] text-[var(--blue-l)] font-semibold">{widgetLinks[widget]!.label}</span>
                                <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
                              </Link>
                            )}
                          </div>

                          <div className="flex-1 min-h-0 overflow-hidden">
                            {widgetComponents()[widget]()}
                          </div>
                        </div>
                      </ResizablePanel>
                    </React.Fragment>
                  ))}
                </ResizablePanelGroup>
              </ResizablePanel>
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      </DashCtx.Provider>
    </div>
  );
}
