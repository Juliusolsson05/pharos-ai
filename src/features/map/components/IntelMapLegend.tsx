const LEGEND_ITEMS = [
  { color: 'var(--blue)', shape: 'rect', label: 'US STRIKE TRACK' },
  { color: 'var(--il-green)', shape: 'rect', label: 'IDF STRIKE TRACK' },
  { color: 'var(--teal)', shape: 'rect', label: 'NAVAL STRIKE' },
  { color: 'var(--danger)', shape: 'rect', label: 'HOSTILE MISSILE' },
  { color: 'var(--gold)', shape: 'rect', label: 'INTERCEPTED MISSILE' },
  { color: 'var(--danger)', shape: 'circle', label: 'DESTROYED TARGET' },
  { color: 'var(--warning)', shape: 'circle', label: 'DAMAGED TARGET' },
  { color: 'var(--gold)', shape: 'circle', label: 'TARGETED' },
  { color: 'var(--blue)', shape: 'circle', label: 'US ASSET' },
  { color: 'var(--teal)', shape: 'circle', label: 'IDF ASSET' },
  { color: 'var(--danger)', shape: 'zone', label: 'CLOSURE ZONE' },
  { color: 'var(--warning)', shape: 'zone', label: 'PATROL ZONE' },
] as const;

export function IntelMapLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 12,
        background: 'rgba(28,33,39,0.92)',
        border: '1px solid var(--bd)',
        borderRadius: 2,
        padding: '10px 12px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 'var(--text-tiny)', color: 'var(--t4)', marginBottom: 6 }}>LEGEND</div>
      {LEGEND_ITEMS.map(({ color, shape, label }) => (
        <div
          key={label}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, fontSize: 'var(--text-caption)', color: 'var(--t3)' }}
        >
          {shape === 'rect' ? (
            <div style={{ width: 12, height: 3, background: color, flexShrink: 0 }} />
          ) : shape === 'zone' ? (
            <div style={{ width: 10, height: 8, background: color + '44', border: `1px solid ${color}`, flexShrink: 0 }} />
          ) : (
            <div
              style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}
            />
          )}
          {label}
        </div>
      ))}
    </div>
  );
}
