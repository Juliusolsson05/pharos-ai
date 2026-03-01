'use client';
import Link           from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'OVERVIEW', href: '/dashboard'          },
  { label: 'EVENTS',   href: '/dashboard/feed'     },
  { label: 'ACTORS',   href: '/dashboard/actors'   },
  { label: 'SIGNALS',  href: '/dashboard/signals'  },
  { label: 'BRIEF',    href: '/dashboard/brief'    },
  { label: 'MAP',         href: '/dashboard/map'         },
  { label: 'PREDICTIONS', href: '/dashboard/predictions' },
];

export function Header() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === '/dashboard' ? path === '/dashboard' : path.startsWith(href);

  return (
    <header style={{
      height: 44,
      background: 'var(--bg-app)',
      borderBottom: '1px solid var(--bd)',
      display: 'flex',
      alignItems: 'stretch',
      flexShrink: 0,
      zIndex: 50,
    }}>
      {/* ── Logo + conflict name ── */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', borderRight: '1px solid var(--bd)', flexShrink: 0 }}>
        {/* Hexagon + circle SVG */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <polygon
            points="10,1.5 18,5.8 18,14.2 10,18.5 2,14.2 2,5.8"
            fill="none"
            stroke="var(--blue)"
            strokeWidth="1.5"
          />
          <circle cx="10" cy="10" r="3" fill="var(--blue)" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontFamily: 'SFMono-Regular, Menlo, monospace', fontSize: 11, fontWeight: 700, color: 'var(--t1)', letterSpacing: '0.12em' }}>
            ◈ PHAROS
          </span>
          <span style={{ fontFamily: 'SFMono-Regular, Menlo, monospace', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.08em' }}>
            OPERATION EPIC FURY
          </span>
        </div>
        {/* ONGOING badge */}
        <div style={{
          padding: '2px 7px',
          background: 'var(--danger-dim)',
          border: '1px solid rgba(231,106,110,.35)',
          marginLeft: 4,
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--danger)', letterSpacing: '0.08em', fontFamily: 'system-ui' }}>
            ONGOING
          </span>
        </div>
      </Link>

      {/* ── Nav tabs ── */}
      <nav style={{ display: 'flex', alignItems: 'stretch', height: '100%', flex: 1 }}>
        {NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'stretch' }}>
              <div className={`nav-item${active ? ' active' : ''}`}>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Right side ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', borderLeft: '1px solid var(--bd)', flexShrink: 0 }}>
        {/* LIVE indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div className="dot dot-live" />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', letterSpacing: '0.06em', fontFamily: 'SFMono-Regular, monospace' }}>LIVE</span>
        </div>

        {/* UTC clock */}
        <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'SFMono-Regular, monospace', letterSpacing: '0.02em' }}>
          2026-03-01 · UTC
        </span>

        {/* 3 KIA badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 9px',
          background: 'var(--danger-dim)',
          border: '1px solid rgba(231,106,110,.35)',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--danger)', letterSpacing: '0.08em', fontFamily: 'system-ui' }}>
            3 US KIA
          </span>
        </div>
      </div>
    </header>
  );
}
