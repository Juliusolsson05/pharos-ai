'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, Activity, RefreshCw } from 'lucide-react';
import type { PredictionMarket } from '@/app/api/polymarket/route';

const CAT_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  NUCLEAR:     { bg: '#2D1C1C', border: '#D23232', text: '#E84C4C' },
  MILITARY:    { bg: '#2D1C1C', border: '#D26832', text: '#E89C4C' },
  CEASEFIRE:   { bg: '#1C2D1C', border: '#32D268', text: '#4CE884' },
  NAVAL:       { bg: '#1C2032', border: '#3268D2', text: '#4C9BE8' },
  POLITICAL:   { bg: '#2A1C2D', border: '#9832D2', text: '#C84CE8' },
  ECONOMIC:    { bg: '#2D2A1C', border: '#D2A832', text: '#E8D24C' },
  GEOPOLITICAL:{ bg: '#1C2A2D', border: '#32B4D2', text: '#4CD4E8' },
};

const ALL_CATEGORIES = ['NUCLEAR', 'MILITARY', 'CEASEFIRE', 'NAVAL', 'POLITICAL', 'ECONOMIC', 'GEOPOLITICAL'];

function fmtVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

function probColor(p: number): string {
  if (p >= 0.65) return '#4CE884';
  if (p >= 0.35) return '#E8D24C';
  return '#E84C4C';
}

function MarketCard({ market }: { market: PredictionMarket }) {
  const [hovered, setHovered] = useState(false);
  const cat = CAT_STYLE[market.category] ?? CAT_STYLE.GEOPOLITICAL;
  const isBinary = market.outcomes.length === 2;
  const yesIdx = market.outcomes.findIndex(o => o.toUpperCase() === 'YES');
  const yesProb = yesIdx >= 0 ? (market.prices[yesIdx] ?? 0) : (market.prices[0] ?? 0);
  const color = probColor(yesProb);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-2)',
        border: `1px solid ${hovered ? 'var(--bd-s)' : 'var(--bd)'}`,
        borderRadius: 2,
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Card header */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--bd)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            padding: '2px 6px',
            background: cat.bg,
            border: `1px solid ${cat.border}`,
            borderRadius: 2,
            fontSize: 8,
            fontFamily: 'SFMono-Regular, Menlo, monospace',
            fontWeight: 700,
            color: cat.text,
            letterSpacing: '0.08em',
          }}>
            {market.category}
          </span>
          <span style={{
            fontSize: 10,
            fontFamily: 'SFMono-Regular, Menlo, monospace',
            color: 'var(--t4)',
          }}>
            {fmtVol(market.volume)}
          </span>
        </div>
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--t1)',
          lineHeight: 1.4,
          marginTop: 6,
          marginBottom: 0,
        }}>
          {market.title}
        </p>
      </div>

      {/* Probability section */}
      <div style={{ padding: '10px 12px', flex: 1 }}>
        {isBinary ? (
          <>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'SFMono-Regular, Menlo, monospace',
              color,
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {Math.round(yesProb * 100)}%
            </div>
            {/* Probability bar */}
            <div style={{
              width: '100%',
              height: 6,
              background: 'var(--bg-3)',
              borderRadius: 1,
              marginBottom: 6,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${yesProb * 100}%`,
                height: '100%',
                background: color,
                borderRadius: 1,
              }} />
            </div>
            <div style={{
              fontSize: 10,
              fontFamily: 'SFMono-Regular, Menlo, monospace',
              color: 'var(--t3)',
            }}>
              {market.outcomes.map((o, i) => (
                <span key={o}>
                  {i > 0 && ' · '}
                  {o} {Math.round((market.prices[i] ?? 0) * 100)}%
                </span>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {market.outcomes.slice(0, 4).map((outcome, i) => {
              const p = market.prices[i] ?? 0;
              const c = probColor(p);
              return (
                <div key={outcome} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'SFMono-Regular, Menlo, monospace',
                    color: 'var(--t3)',
                    width: 80,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {outcome}
                  </span>
                  <div style={{
                    flex: 1,
                    height: 4,
                    background: 'var(--bg-3)',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}>
                    <div style={{ width: `${p * 100}%`, height: '100%', background: c, borderRadius: 1 }} />
                  </div>
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'SFMono-Regular, Menlo, monospace',
                    color: c,
                    width: 30,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                    {Math.round(p * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div style={{
        padding: '6px 12px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderTop: '1px solid var(--bd)',
      }}>
        {/* Status pill */}
        {market.active && !market.closed ? (
          <span style={{
            padding: '1px 5px',
            background: 'rgba(76,232,132,0.12)',
            border: '1px solid rgba(76,232,132,0.3)',
            borderRadius: 2,
            fontSize: 8,
            fontFamily: 'SFMono-Regular, Menlo, monospace',
            fontWeight: 700,
            color: '#4CE884',
            letterSpacing: '0.06em',
          }}>
            ACTIVE
          </span>
        ) : market.closed ? (
          <span style={{
            padding: '1px 5px',
            background: 'rgba(92,112,128,0.2)',
            border: '1px solid rgba(92,112,128,0.3)',
            borderRadius: 2,
            fontSize: 8,
            fontFamily: 'SFMono-Regular, Menlo, monospace',
            fontWeight: 700,
            color: '#5C7080',
            letterSpacing: '0.06em',
          }}>
            CLOSED
          </span>
        ) : (
          <span style={{
            padding: '1px 5px',
            background: 'rgba(76,155,232,0.12)',
            border: '1px solid rgba(76,155,232,0.3)',
            borderRadius: 2,
            fontSize: 8,
            fontFamily: 'SFMono-Regular, Menlo, monospace',
            fontWeight: 700,
            color: '#4C9BE8',
            letterSpacing: '0.06em',
          }}>
            RESOLVED
          </span>
        )}

        <span style={{
          fontSize: 9,
          fontFamily: 'SFMono-Regular, Menlo, monospace',
          color: 'var(--t4)',
        }}>
          {fmtDate(market.endDate)}
        </span>

        <Link
          href={market.polyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            textDecoration: 'none',
            color: 'var(--blue)',
            fontSize: 9,
            fontFamily: 'SFMono-Regular, Menlo, monospace',
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          <ExternalLink size={10} />
          POLYMARKET
        </Link>
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'volume' | 'volume24hr' | 'probability'>('volume');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMarkets = async () => {
    setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/polymarket');
      const data = await res.json() as { markets: PredictionMarket[]; fetchedAt: string; error?: string };
      if (data.error) throw new Error(data.error);
      setMarkets(data.markets);
      setFetchedAt(data.fetchedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchMarkets(); }, []);

  const filtered = useMemo(() => {
    let m = markets;
    if (activeCategory !== 'ALL') m = m.filter(x => x.category === activeCategory);
    if (showActiveOnly) m = m.filter(x => x.active && !x.closed);
    if (sortBy === 'volume') m = [...m].sort((a, b) => b.volume - a.volume);
    if (sortBy === 'volume24hr') m = [...m].sort((a, b) => b.volume24hr - a.volume24hr);
    if (sortBy === 'probability') {
      m = [...m].sort((a, b) => {
        const pa = a.prices[0] ?? 0;
        const pb = b.prices[0] ?? 0;
        return Math.abs(pb - 0.5) - Math.abs(pa - 0.5);
      });
    }
    return m;
  }, [markets, activeCategory, sortBy, showActiveOnly]);

  const totalVolume = markets.reduce((s, m) => s + m.volume, 0);
  const totalVol24h = markets.reduce((s, m) => s + m.volume24hr, 0);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of markets) {
      counts[m.category] = (counts[m.category] ?? 0) + 1;
    }
    return counts;
  }, [markets]);

  const lastUpdated = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-1)',
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div style={{
        height: 44,
        background: 'var(--bg-app)',
        borderBottom: '1px solid var(--bd)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'SFMono-Regular, Menlo, monospace',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--blue)',
          letterSpacing: '0.10em',
        }}>
          ◈ PREDICTIONS
        </span>
        <span style={{
          fontFamily: 'SFMono-Regular, Menlo, monospace',
          fontSize: 9,
          color: '#5C7080',
          letterSpacing: '0.08em',
        }}>
          POWERED BY POLYMARKET
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Market count badge */}
          <div style={{
            padding: '2px 8px',
            background: 'rgba(76,155,232,0.1)',
            border: '1px solid rgba(76,155,232,0.25)',
            borderRadius: 2,
          }}>
            <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--blue)', fontWeight: 700 }}>
              {markets.length} MARKETS
            </span>
          </div>

          {/* Total volume badge */}
          <div style={{
            padding: '2px 8px',
            background: 'rgba(76,232,132,0.08)',
            border: '1px solid rgba(76,232,132,0.2)',
            borderRadius: 2,
          }}>
            <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: '#4CE884', fontWeight: 700 }}>
              {fmtVol(totalVolume)} VOL
            </span>
          </div>

          {/* Last updated */}
          <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)' }}>
            UPDATED {lastUpdated}
          </span>

          {/* Refresh button */}
          <button
            onClick={fetchMarkets}
            disabled={loading}
            style={{
              background: 'none',
              border: '1px solid var(--bd)',
              borderRadius: 2,
              padding: '4px 6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--t3)',
              display: 'flex',
              alignItems: 'center',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        height: 40,
        background: '#161A1F',
        borderBottom: '1px solid var(--bd)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 24,
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em', marginBottom: 1 }}>TOTAL MARKETS</div>
          <div style={{ fontSize: 13, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: 'var(--blue)' }}>{markets.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em', marginBottom: 1 }}>TOTAL VOLUME</div>
          <div style={{ fontSize: 13, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: 'var(--blue)' }}>{fmtVol(totalVolume)}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em', marginBottom: 1 }}>24H VOLUME</div>
          <div style={{ fontSize: 13, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: 'var(--blue)' }}>{fmtVol(totalVol24h)}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em', marginBottom: 1 }}>CATEGORIES</div>
          <div style={{ fontSize: 10, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: 'var(--blue)', display: 'flex', gap: 8 }}>
            {Object.entries(catCounts).map(([cat, count]) => (
              <span key={cat} style={{ color: CAT_STYLE[cat]?.text ?? 'var(--blue)' }}>
                {cat.slice(0, 3)} {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        height: 38,
        borderBottom: '1px solid var(--bd)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
        flexShrink: 0,
        background: 'var(--bg-app)',
        overflowX: 'auto',
      }}>
        <span style={{
          fontSize: 8,
          fontFamily: 'SFMono-Regular, Menlo, monospace',
          color: 'var(--t4)',
          letterSpacing: '0.08em',
          flexShrink: 0,
        }}>
          FILTER:
        </span>

        {/* ALL pill */}
        <button
          onClick={() => setActiveCategory('ALL')}
          style={{
            padding: '2px 8px',
            background: activeCategory === 'ALL' ? 'rgba(76,155,232,0.15)' : 'var(--bg-2)',
            border: `1px solid ${activeCategory === 'ALL' ? 'var(--blue)' : 'var(--bd)'}`,
            borderRadius: 2,
            cursor: 'pointer',
            fontSize: 8,
            fontFamily: 'SFMono-Regular, Menlo, monospace',
            fontWeight: 700,
            color: activeCategory === 'ALL' ? 'var(--blue)' : 'var(--t3)',
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}
        >
          ALL
        </button>

        {/* Category pills */}
        {ALL_CATEGORIES.map(cat => {
          const style = CAT_STYLE[cat] ?? CAT_STYLE.GEOPOLITICAL;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '2px 8px',
                background: isActive ? style.bg : 'var(--bg-2)',
                border: `1px solid ${isActive ? style.border : 'var(--bd)'}`,
                borderRadius: 2,
                cursor: 'pointer',
                fontSize: 8,
                fontFamily: 'SFMono-Regular, Menlo, monospace',
                fontWeight: 700,
                color: isActive ? style.text : 'var(--t3)',
                letterSpacing: '0.06em',
                flexShrink: 0,
              }}
            >
              {cat}
            </button>
          );
        })}

        {/* Right side controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'volume' | 'volume24hr' | 'probability')}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--bd)',
              borderRadius: 2,
              padding: '2px 6px',
              fontSize: 8,
              fontFamily: 'SFMono-Regular, Menlo, monospace',
              fontWeight: 700,
              color: 'var(--t2)',
              cursor: 'pointer',
              letterSpacing: '0.06em',
              outline: 'none',
            }}
          >
            <option value="volume">VOLUME</option>
            <option value="volume24hr">24H VOL</option>
            <option value="probability">PROBABILITY</option>
          </select>

          <button
            onClick={() => setShowActiveOnly(v => !v)}
            style={{
              padding: '2px 8px',
              background: showActiveOnly ? 'rgba(76,232,132,0.12)' : 'var(--bg-2)',
              border: `1px solid ${showActiveOnly ? 'rgba(76,232,132,0.4)' : 'var(--bd)'}`,
              borderRadius: 2,
              cursor: 'pointer',
              fontSize: 8,
              fontFamily: 'SFMono-Regular, Menlo, monospace',
              fontWeight: 700,
              color: showActiveOnly ? '#4CE884' : 'var(--t3)',
              letterSpacing: '0.06em',
            }}
          >
            ACTIVE ONLY
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
            color: 'var(--t4)',
          }}>
            <Activity
              size={24}
              style={{ animation: 'spin 1s linear infinite', color: 'var(--blue)' }}
            />
            <span style={{
              fontSize: 10,
              fontFamily: 'SFMono-Regular, Menlo, monospace',
              letterSpacing: '0.1em',
              color: 'var(--t3)',
            }}>
              FETCHING POLYMARKET DATA...
            </span>
          </div>
        ) : error ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            color: '#E84C4C',
            fontFamily: 'SFMono-Regular, Menlo, monospace',
            fontSize: 11,
          }}>
            ERROR: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            color: 'var(--t4)',
            fontFamily: 'SFMono-Regular, Menlo, monospace',
            fontSize: 11,
            letterSpacing: '0.1em',
          }}>
            NO MARKETS FOUND
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}>
            {filtered.map(market => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
