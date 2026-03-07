'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRssFeeds } from '@/features/news/queries';
import type { RssFeed, FeedItem } from '@/types/domain';
import { useIsLandscapePhone } from '@/hooks/use-is-landscape-phone';

// ─── Types ────────────────────────────────────────────────────

type TimelineArticle = {
  id: string;
  title: string;
  link: string;
  snippet: string;
  time: Date;
  feed: RssFeed;
  imageUrl?: string;
};

type NewsTimelineProps = {
  feedData: Map<string, FeedItem[]>;
};

// ─── Colors ───────────────────────────────────────────────────

import { Button } from '@/components/ui/button';
import { PERSPECTIVE_COLORS } from '@/features/news/lib/news-colors';
import { ago } from '@/shared/lib/format';

// ─── Tier → vertical distance from spine ──────────────────────

const TIER_Y_OFFSET: Record<number, number> = {
  1: 16,
  2: 90,
  3: 175,
  4: 265,
};

const TIER_LABELS: Record<number, string> = {
  1: 'WIRE',
  2: 'MAJOR',
  3: 'REGIONAL',
  4: 'STATE',
};

// Layout
const CARD_W = 260;
const CARD_GAP = 16;
const TIME_SLOT_W = CARD_W + CARD_GAP;
const IMG_H = 100;
const CARD_H_IMG = IMG_H + 90;   // card height with image
const CARD_H_NO_IMG = 100;       // card height without image
const PADDING_X = 160;
const SPINE_Y = 620;              // enough room for T4 cards (265 offset + ~190 card height = 455px above spine)
const CANVAS_H = SPINE_Y * 2 + 200; // symmetric below

// Zoom
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1.2;
const ZOOM_STEP = 0.06;
const DEFAULT_ZOOM = 0.65;

// ─── Helpers ──────────────────────────────────────────────────

function formatHour(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatTimeAgo(d: Date): string {
  return ago(d.toISOString());
}

/** Proxy image through our cache to avoid rate limiting */
function proxyImg(url: string): string {
  return `/api/v1/img?url=${encodeURIComponent(url)}`;
}

// ─── Component ────────────────────────────────────────────────

export function NewsTimeline({ feedData }: NewsTimelineProps) {
  const { data: allFeeds } = useRssFeeds();
  const isLandscapePhone = useIsLandscapePhone();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedTiers, setSelectedTiers] = useState<Set<number>>(new Set([1, 2, 3, 4]));
  const [viewportWidth, setViewportWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  // ── Use refs as the single source of truth for transform state.
  // Event handlers read/write refs directly — no stale closures.
  // setState only triggers re-render; actual values come from refs.
  const zoomRef = useRef(DEFAULT_ZOOM);
  const panRef  = useRef({ x: 0, y: 0 });
  const [transform, setTransform] = useState({ zoom: DEFAULT_ZOOM, pan: { x: 0, y: 0 } });

  const commitTransform = useCallback(() => {
    setTransform({ zoom: zoomRef.current, pan: { ...panRef.current } });
  }, []);

  const zoom = transform.zoom;
  const pan  = transform.pan;

  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false });
  const initialCenterDone = useRef(false);

  // ─── Drag to pan (registered once — reads refs, no deps) ────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onDown = (e: MouseEvent) => {
      // Don't intercept clicks on links or buttons
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) return;
      dragState.current = {
        active: true,
        startX: e.clientX, startY: e.clientY,
        panX: panRef.current.x, panY: panRef.current.y,
        moved: false,
      };
      setIsDragging(true);
      // Note: no preventDefault here — lets native link clicks through
    };

    const onMove = (e: MouseEvent) => {
      if (!dragState.current.active) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragState.current.moved = true;
        e.preventDefault(); // only prevent default once we're actually dragging
      }
      if (!dragState.current.moved) return;
      panRef.current = { x: dragState.current.panX + dx, y: dragState.current.panY + dy };
      commitTransform();
    };

    const onClick = (e: MouseEvent) => {
      // Suppress click only if we actually dragged — not on normal clicks
      if (dragState.current.moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onUp = () => {
      dragState.current.active = false;
      setIsDragging(false);
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('click', onClick, true);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('click', onClick, true);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [commitTransform]); // commitTransform is stable

  // ─── Scroll to zoom (registered once — reads refs, no deps) ─
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentZoom = zoomRef.current;
      const direction = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + direction * ZOOM_STEP));
      if (newZoom === currentZoom) return;

      const scale = newZoom / currentZoom;
      const px = panRef.current.x;
      const py = panRef.current.y;

      panRef.current  = { x: mouseX - scale * (mouseX - px), y: mouseY - scale * (mouseY - py) };
      zoomRef.current = newZoom;
      commitTransform();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [commitTransform]); // commitTransform is stable

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    setViewportWidth(vp.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setViewportWidth(entry.contentRect.width);
      }
    });
    observer.observe(vp);
    return () => observer.disconnect();
  }, []);

  // ─── Articles ───────────────────────────────────────────────
  const articles = useMemo(() => {
    const items: TimelineArticle[] = [];
    feedData.forEach((feedItems, feedId) => {
      const feed = (allFeeds ?? []).find(f => f.id === feedId);
      if (!feed) return;
      for (const item of feedItems) {
        const dateStr = item.isoDate ?? item.pubDate;
        if (!dateStr) continue;
        const time = new Date(dateStr);
        if (isNaN(time.getTime())) continue;
        items.push({
          id: `${feedId}-${time.getTime()}-${item.link}`,
          title: item.title,
          link: item.link,
          snippet: item.contentSnippet ?? '',
          time,
          feed,
          imageUrl: item.imageUrl,
        });
      }
    });
    items.sort((a, b) => a.time.getTime() - b.time.getTime());
    return items;
  }, [feedData, allFeeds]);

  const filtered = useMemo(
    () => articles.filter(a => selectedTiers.has(a.feed.tier)),
    [articles, selectedTiers],
  );

  // ─── Layout ─────────────────────────────────────────────────
  const layout = useMemo(() => {
    const laneNextX: Record<string, number> = {};
    const positioned: { article: TimelineArticle; x: number; above: boolean; yOffset: number }[] = [];
    const hourMarkers: { hour: Date; x: number }[] = [];
    let lastHourStr = '';
    let globalIdx = 0;

    for (const article of filtered) {
      const tier = article.feed.tier;
      const yOffset = TIER_Y_OFFSET[tier] ?? 160;
      const above = globalIdx % 2 === 0;
      const laneKey = `${above ? 'a' : 'b'}-${tier}`;

      const globalX = PADDING_X + globalIdx * TIME_SLOT_W;
      const laneX = laneNextX[laneKey] ?? 0;
      const x = Math.max(globalX, laneX);
      laneNextX[laneKey] = x + CARD_W + CARD_GAP;

      const hourStr = formatHour(article.time).slice(0, 2);
      if (hourStr !== lastHourStr) {
        hourMarkers.push({ hour: new Date(article.time), x: x + CARD_W / 2 });
        lastHourStr = hourStr;
      }

      positioned.push({ article, x, above, yOffset });
      globalIdx++;
    }

    const totalWidth = Math.max(PADDING_X * 2 + (globalIdx + 1) * TIME_SLOT_W, 1200);
    return { positioned, hourMarkers, totalWidth };
  }, [filtered]);

  // ─── Center on newest ───────────────────────────────────────
  const centerOnNewest = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || layout.positioned.length === 0) return;
    const rect = vp.getBoundingClientRect();
    const last = layout.positioned[layout.positioned.length - 1];
    const targetX = last.x + CARD_W / 2;
    const z = zoomRef.current;
    panRef.current = {
      x: rect.width - targetX * z - 200,
      y: (rect.height / 2) - SPINE_Y * z,
    };
    commitTransform();
  }, [layout, commitTransform]);

  // Initial center
  useEffect(() => {
    if (initialCenterDone.current || layout.positioned.length === 0) return;
    initialCenterDone.current = true;
    requestAnimationFrame(centerOnNewest);
  }, [layout.positioned.length, centerOnNewest]);

  const resetView = useCallback(() => {
    zoomRef.current = DEFAULT_ZOOM;
    requestAnimationFrame(() => {
      const vp = viewportRef.current;
      if (!vp || layout.positioned.length === 0) return;
      const rect = vp.getBoundingClientRect();
      const last = layout.positioned[layout.positioned.length - 1];
      const targetX = last.x + CARD_W / 2;
      panRef.current = {
        x: rect.width - targetX * DEFAULT_ZOOM - 200,
        y: (rect.height / 2) - SPINE_Y * DEFAULT_ZOOM,
      };
      commitTransform();
    });
  }, [layout, commitTransform]);

  // Saved transform for restoring after defocus
  const savedTransform = useRef<{ zoom: number; pan: { x: number; y: number } } | null>(null);

  const focusCard = useCallback((article: TimelineArticle, cardX: number, cardTop: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();

    // Save current transform to restore on blur
    savedTransform.current = { zoom: zoomRef.current, pan: { ...panRef.current } };

    // Zoom to 1.0, center the expanded card (EXP_W wide, from cardTop downward)
    const TARGET_ZOOM = 1.0;
    const EXP_W = CARD_W + 160;
    const expLeft = Math.max(20, cardX - (EXP_W - CARD_W) / 2);
    const expandedCenterX = expLeft + EXP_W / 2;
    // Expanded card grows downward from cardTop — center vertically on it
    const expCardH = (article.imageUrl ? 180 : 0) + 200; // rough expanded height
    const expandedCenterY = cardTop + expCardH / 2;

    panRef.current = {
      x: rect.width / 2 - expandedCenterX * TARGET_ZOOM,
      y: rect.height / 2 - expandedCenterY * TARGET_ZOOM,
    };
    zoomRef.current = TARGET_ZOOM;
    commitTransform();
    setFocusedId(article.id);
  }, [commitTransform]);

  const defocus = useCallback(() => {
    if (savedTransform.current) {
      panRef.current = savedTransform.current.pan;
      zoomRef.current = savedTransform.current.zoom;
      savedTransform.current = null;
      commitTransform();
    }
    setFocusedId(null);
  }, [commitTransform]);

  // Escape key to defocus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') defocus(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [defocus]);

  const toggleTier = useCallback((tier: number) => {
    setSelectedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) { if (next.size > 1) next.delete(tier); }
      else { next.add(tier); }
      return next;
    });
  }, []);

  const zoomPct = Math.round(zoom * 100);

  // ─── Viewport culling for performance ───────────────────────
  const visibleCards = useMemo(() => {
    if (viewportWidth <= 0) return layout.positioned;
    // Calculate visible canvas region
    const viewLeft = -pan.x / zoom - 200;
    const viewRight = (-pan.x + viewportWidth) / zoom + 200;
    return layout.positioned.filter(({ x }) => {
      return x + CARD_W > viewLeft && x < viewRight;
    });
  }, [layout.positioned, pan.x, zoom, viewportWidth]);

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* Header */}
      <div className={`${isLandscapePhone ? 'safe-px' : 'px-5'} py-2 bg-[var(--bg-2)] border-b border-[var(--bd)] flex items-center gap-3 shrink-0 z-10`}>
        <span className="mono text-[11px] font-bold text-white tracking-wider">TIMELINE</span>
        <div className="w-px h-4 bg-white/20" />

        <div className="flex gap-1">
          {[1, 2, 3, 4].map(tier => (
            <Button
              key={tier}
              variant="ghost"
              size="sm"
              onClick={() => toggleTier(tier)}
              className={`px-2 py-1 h-auto rounded text-[9px] mono font-bold tracking-wider
                ${selectedTiers.has(tier)
                  ? 'bg-white/15 text-white border border-white/30'
                  : 'text-white/40 border border-transparent hover:text-white/70'
                }`}
            >
              T{tier} {TIER_LABELS[tier]}
            </Button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-white/20 rounded px-2 py-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { zoomRef.current = Math.max(MIN_ZOOM, zoomRef.current - ZOOM_STEP * 2); commitTransform(); }}
              className="mono text-[12px] h-auto p-0 text-white/70 hover:text-white w-4 text-center"
            >−</Button>
            <span className="mono text-[9px] text-white/70 w-10 text-center font-bold">{zoomPct}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { zoomRef.current = Math.min(MAX_ZOOM, zoomRef.current + ZOOM_STEP * 2); commitTransform(); }}
              className="mono text-[12px] h-auto p-0 text-white/70 hover:text-white w-4 text-center"
            >+</Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={centerOnNewest}
            className="mono text-[9px] h-auto font-bold text-white/70 hover:text-white px-2 py-1 border-white/20"
          >
            → LATEST
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetView}
            className="mono text-[9px] h-auto p-0 text-white/50 hover:text-white"
          >
            RESET
          </Button>
          <span className="mono text-[9px] font-bold text-white/60">{filtered.length} articles</span>
        </div>
      </div>

      {/* ─── Canvas viewport ─── */}
      <div
        ref={viewportRef}
        className="flex-1 min-h-0 overflow-hidden relative"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          background: '#0a0a0f',
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x % (24 * zoom)}px ${pan.y % (24 * zoom)}px`,
          }}
        />

        {/* Canvas layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            width: `${layout.totalWidth}px`,
            height: `${CANVAS_H}px`,
            willChange: 'transform',
            transition: focusedId ? 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }}
        >
          {/* ─── Spine ─── */}
          <div
            className="absolute left-0 right-0 h-[3px] bg-white/20"
            style={{ top: `${SPINE_Y}px` }}
          />

          {/* Axis labels */}
          <div
            className="absolute mono text-[12px] text-white/60 tracking-widest font-bold"
            style={{ top: `${SPINE_Y - 30}px`, left: '24px' }}
          >
            ▲ IMPORTANT
          </div>
          <div
            className="absolute mono text-[12px] text-white/60 tracking-widest font-bold"
            style={{ top: `${SPINE_Y + 16}px`, left: '24px' }}
          >
            ▼ NICHE
          </div>
          <div
            className="absolute mono text-[12px] text-white/60 font-bold"
            style={{ top: `${SPINE_Y - 8}px`, right: '30px' }}
          >
            NOW →
          </div>

          {/* ─── Hour markers ─── */}
          {layout.hourMarkers.map(({ hour, x }) => (
            <div key={hour.toISOString()}>
              <div
                className="absolute w-px bg-white/[0.08]"
                style={{ left: `${x}px`, top: '0', bottom: '0' }}
              />
              {/* Above spine */}
              <div
                className="absolute mono text-[16px] font-bold text-white whitespace-nowrap"
                style={{ left: `${x - 22}px`, top: `${SPINE_Y - 50}px` }}
              >
                {formatHour(hour)}
              </div>
              {/* Below spine */}
              <div
                className="absolute mono text-[16px] font-bold text-white whitespace-nowrap"
                style={{ left: `${x - 22}px`, top: `${SPINE_Y + 26}px` }}
              >
                {formatHour(hour)}
              </div>
              {/* Dot */}
              <div
                className="absolute w-5 h-5 rounded-full bg-[#0a0a0f] border-[3px] border-white/50"
                style={{ left: `${x - 10}px`, top: `${SPINE_Y - 9}px` }}
              />
            </div>
          ))}

          {/* ─── Cards (only visible ones for perf) ─── */}
          {visibleCards.map(({ article, x, above, yOffset }) => {
            const color = PERSPECTIVE_COLORS[article.feed.perspective] ?? '#6b7280';
            const isHovered = hoveredId === article.id;
            const isFocused = focusedId === article.id;
            const hasImg = !!article.imageUrl;
            const cardH = hasImg ? CARD_H_IMG : CARD_H_NO_IMG;

            const cardTop = above
              ? SPINE_Y - yOffset - cardH
              : SPINE_Y + yOffset + 20;

            const connectorTop = above ? cardTop + cardH : SPINE_Y + 2;
            const connectorH = above ? SPINE_Y - (cardTop + cardH) : cardTop - SPINE_Y - 2;
            const cardCenter = x + CARD_W / 2;

            return (
              <div key={article.id}>
                {/* Connector */}
                <div
                  className="absolute"
                  style={{
                    left: `${cardCenter}px`,
                    top: `${connectorTop}px`,
                    width: '2px',
                    height: `${Math.max(connectorH, 0)}px`,
                    backgroundColor: color,
                    opacity: isFocused ? 0.9 : isHovered ? 0.8 : 0.3,
                  }}
                />
                {/* Spine dot */}
                <div
                  className="absolute rounded-full"
                  style={{
                    left: `${cardCenter - 5}px`,
                    top: `${SPINE_Y - 5}px`,
                    width: isFocused ? '14px' : '10px',
                    height: isFocused ? '14px' : '10px',
                    marginLeft: isFocused ? '-2px' : '0',
                    marginTop: isFocused ? '-2px' : '0',
                    backgroundColor: color,
                    opacity: isFocused ? 1 : isHovered ? 1 : 0.7,
                    boxShadow: isFocused ? `0 0 20px ${color}, 0 0 40px ${color}60` : isHovered ? `0 0 14px ${color}` : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />

                {/* Card — normal state */}
                {!isFocused && (
                  <div
                    className="absolute"
                    style={{ left: `${x}px`, top: `${cardTop}px`, width: `${CARD_W}px`, cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredId(article.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => focusCard(article, x, cardTop)}
                  >
                    <div
                      className={`rounded-lg border overflow-hidden transition-all duration-150
                        ${isHovered
                          ? 'bg-[#1a1a24] border-white/30 shadow-2xl shadow-black/50'
                          : 'bg-[#111118] border-white/15'
                        }`}
                    >
                      {hasImg && (
                        <div className="w-full overflow-hidden bg-[#0a0a0f]" style={{ height: `${IMG_H}px` }}>
                          <Image
                            src={proxyImg(article.imageUrl!)}
                            alt=""
                            width={CARD_W}
                            height={IMG_H}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="px-3 py-2.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="px-1.5 py-0.5 rounded text-[8px] mono font-bold leading-none"
                            style={{ backgroundColor: `${color}30`, color, border: `1px solid ${color}50` }}
                          >
                            {article.feed.name.length > 14 ? article.feed.id.toUpperCase() : article.feed.name.toUpperCase()}
                          </div>
                          {article.feed.stateFunded && (
                            <span className="text-[8px] mono font-bold text-amber-400 tracking-wider">STATE</span>
                          )}
                          <span className="mono text-[11px] font-bold text-white ml-auto shrink-0">
                            {formatHour(article.time)}
                          </span>
                          <span className="mono text-[9px] text-white/70 shrink-0">
                            {formatTimeAgo(article.time)}
                          </span>
                        </div>
                        <h4 className="text-[12px] text-white font-semibold leading-snug line-clamp-2">
                          {article.title}
                        </h4>
                        {article.snippet && (
                          <p className="text-[10px] text-white/70 mt-1 leading-relaxed line-clamp-2">
                            {article.snippet}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] mono font-bold text-white/60">{article.feed.country}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 - article.feed.tier }).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                            ))}
                            {Array.from({ length: article.feed.tier - 1 }).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            ))}
                          </div>
                          {isHovered && (
                            <span className="ml-auto text-[8px] mono text-white/40">click to expand</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card — focused/expanded state */}
                {isFocused && (() => {
                  const EXP_W = CARD_W + 160;
                  // Horizontal: center on card, clamp left edge
                  const expLeft = Math.max(20, x - (EXP_W - CARD_W) / 2);
                  // Vertical: grow TOWARD the spine (inward) not away from it.
                  // Above-spine cards: expanded card anchored at cardTop (grows down toward spine)
                  // Below-spine cards: expanded card grows down from cardTop
                  // Either way, anchor at the normal cardTop — expansion goes downward
                  const expTop = Math.max(20, cardTop);
                  return (
                  <div
                    className="absolute"
                    style={{
                      left: `${expLeft}px`,
                      top: `${expTop}px`,
                      width: `${EXP_W}px`,
                      zIndex: 100,
                    }}
                  >
                    <div
                      className="rounded-xl border overflow-hidden"
                      style={{
                        backgroundColor: '#0e0e1a',
                        borderColor: `${color}50`,
                        boxShadow: `0 0 0 1px ${color}20, 0 40px 80px rgba(0,0,0,0.8)`,
                      }}
                    >
                      {hasImg && (
                        <div className="w-full overflow-hidden bg-[#0a0a0f]" style={{ height: '180px' }}>
                          <Image
                            src={proxyImg(article.imageUrl!)}
                            alt=""
                            width={CARD_W + 160}
                            height={180}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="px-5 py-4">
                        {/* Source row */}
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="px-2 py-1 rounded text-[9px] mono font-bold"
                            style={{ backgroundColor: `${color}25`, color, border: `1px solid ${color}40` }}
                          >
                            {article.feed.name.toUpperCase()}
                          </div>
                          {article.feed.stateFunded && (
                            <span className="text-[9px] mono font-bold text-amber-400">STATE FUNDED</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); defocus(); }}
                            className="ml-auto w-6 h-6 text-white/40 hover:text-white text-[20px] leading-none"
                          >
                            ×
                          </Button>
                        </div>
                        {/* Time */}
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="mono text-[13px] font-bold text-white">
                            {article.time.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="mono text-[13px] font-bold text-white">{formatHour(article.time)}</span>
                          <span className="mono text-[11px] text-white/50">{formatTimeAgo(article.time)}</span>
                        </div>
                        {/* Title */}
                        <h3 className="text-[16px] font-bold text-white leading-snug mb-2">
                          {article.title}
                        </h3>
                        {/* Snippet */}
                        {article.snippet && (
                          <p className="text-[12px] text-white/75 leading-relaxed mb-4">
                            {article.snippet}
                          </p>
                        )}
                        {/* Open link */}
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg no-underline font-bold mono text-[10px] tracking-wider transition-opacity hover:opacity-80"
                          style={{ backgroundColor: color, color: '#000' }}
                        >
                          OPEN ARTICLE →
                        </a>
                      </div>
                    </div>
                  </div>
                  );
                })()}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="absolute" style={{ top: `${SPINE_Y - 20}px`, left: '100px' }}>
              <span className="mono text-[13px] text-white/60">No articles for selected tiers</span>
            </div>
          )}
        </div>

        {/* Bottom-left hint */}
        <div className="absolute bottom-4 left-4 mono text-[10px] text-white/40 pointer-events-none">
          {zoomPct}% · scroll to zoom · drag to pan
        </div>

        {/* Dim backdrop when something is focused — click to defocus */}
        {focusedId && (
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={defocus}
          />
        )}
      </div>
    </div>
  );
}
