'use client';

import { type RefObject } from 'react';

import {
  CANVAS_H,
  SPINE_Y,
  type TimelineArticle,
} from './timeline-constants';
import { TimelineCard } from './TimelineCard';
import { TimelineSpine } from './TimelineSpine';

// Types

type Props = {
  layout: {
    positioned: { article: TimelineArticle; x: number; above: boolean; yOffset: number }[];
    hourMarkers: { hour: Date; x: number }[];
    totalWidth: number;
  };
  visibleCards: { article: TimelineArticle; x: number; above: boolean; yOffset: number }[];
  zoom: number;
  pan: { x: number; y: number };
  focusedId: string | null;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  focusCard: (article: TimelineArticle, x: number, cardTop: number) => void;
  defocus: () => void;
  isDragging: boolean;
  viewportRef: RefObject<HTMLDivElement | null>;
  zoomPct: number;
  filteredCount: number;
};

// Component

export function TimelineCanvas({
  layout,
  visibleCards,
  zoom,
  pan,
  focusedId,
  hoveredId,
  setHoveredId,
  focusCard,
  defocus,
  isDragging,
  viewportRef,
  zoomPct,
  filteredCount,
}: Props) {
  return (
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
        <TimelineSpine hourMarkers={layout.hourMarkers} />

        {/* ─── Cards (only visible ones for perf) ─── */}
        {visibleCards.map(({ article, x, above, yOffset }) => (
          <TimelineCard
            key={article.id}
            article={article}
            x={x}
            above={above}
            yOffset={yOffset}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            focusedId={focusedId}
            focusCard={focusCard}
            defocus={defocus}
          />
        ))}

        {filteredCount === 0 && (
          <div className="absolute" style={{ top: `${SPINE_Y - 20}px`, left: '100px' }}>
            <span className="mono text-[length:var(--text-body)] text-white/60">No articles for selected tiers</span>
          </div>
        )}
      </div>

      {/* Bottom-left hint */}
      <div className="absolute bottom-4 left-4 mono text-[length:var(--text-label)] text-white/40 pointer-events-none">
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
  );
}
