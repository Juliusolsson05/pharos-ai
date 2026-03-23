'use client';

import Link from 'next/link';

import { PanelLeft,X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { MapStory } from '@/types/domain';

import { StoryIcon } from './StoryIcon';

// Back button

function BackButton({ isMobile = false, safeTop = false }: { isMobile?: boolean; safeTop?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="mono"
      style={{
        position:   'absolute',
        top:        safeTop ? 'calc(12px + var(--safe-top))' : 12,
        left:       isMobile ? 'max(12px, var(--safe-left))' : 12,
        background: 'var(--blue)',
        color:      'var(--t1)',
        padding:    isMobile ? '6px 10px' : '6px 12px',
        fontSize:   isMobile ? 'var(--text-caption)' : 'var(--text-label)',
        fontWeight: 700,
        borderRadius: 2,
        textDecoration: 'none',
        display:    'inline-block',
        zIndex:     10,
        letterSpacing: '0.06em',
      }}
    >
      {isMobile ? '← OVERVIEW' : '← BACK TO OVERVIEW'}
    </Link>
  );
}

// Active story pill

type StoryPillProps = {
  story:   MapStory;
  onClear: () => void;
  isMobile?: boolean;
  safeTop?: boolean;
};

function ActiveStoryPill({ story, onClear, isMobile = false, safeTop = false }: StoryPillProps) {
  return (
    <div style={{
      position:  'absolute',
      top:       safeTop ? 'calc(12px + var(--safe-top))' : 12,
      left:      '50%',
      transform: 'translateX(-50%)',
      maxWidth: isMobile ? 'calc(100vw - max(24px, calc(var(--safe-left) + var(--safe-right) + 24px)))' : 'none',
      background: 'rgba(28,33,39,0.95)',
      border:    '1px solid var(--bd)',
      borderRadius: 2,
      padding:   '6px 12px',
      display:   'flex',
      alignItems: 'center',
      gap:       8,
      zIndex:    10,
    }}>
      <StoryIcon iconName={story.iconName} category={story.category} size={12} boxSize={22} />
      <span className="mono" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--t1)', fontWeight: 700 }}>
        STORY: {story.title.toUpperCase()}
      </span>
      <Button variant="ghost" size="sm" onClick={onClear} className="h-5 w-5 p-0" style={{ color: 'var(--t4)' }}>
        <X size={12} strokeWidth={2.5} />
      </Button>
    </div>
  );
}

// Main export

type Props = {
  activeStory:  MapStory | null;
  onClearStory: () => void;
  sidebarOpen:  boolean;
  onToggleSidebar: () => void;
  embedded?: boolean;
  isMobile?: boolean;
};

export function MapOverlays({ activeStory, onClearStory, sidebarOpen, onToggleSidebar, embedded = false, isMobile = false }: Props) {
  const safeTop = isMobile && !embedded;

  return (
    <>
      {!embedded && <BackButton isMobile={isMobile} safeTop={safeTop} />}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="mono h-7 px-2"
          style={{
            position:     'absolute',
            top:          safeTop ? 'calc(12px + var(--safe-top))' : 12,
            left:         isMobile
              ? (embedded ? 'max(12px, var(--safe-left))' : 'calc(max(12px, var(--safe-left)) + 96px)')
              : (embedded ? 12 : 170),
            background:   'rgba(28,33,39,0.92)',
            border:       '1px solid var(--bd)',
            borderRadius: 2,
            color:        'var(--t3)',
            fontSize: 'var(--text-label)',
            fontWeight:   700,
            zIndex:       10,
            display:      'flex',
            alignItems:   'center',
            gap:          4,
          }}
          title="Open stories panel"
        >
          <PanelLeft size={14} strokeWidth={2} />
          STORIES
        </Button>
      )}
      {activeStory && <ActiveStoryPill story={activeStory} onClear={onClearStory} isMobile={isMobile} safeTop={safeTop} />}
    </>
  );
}
