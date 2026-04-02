'use client';

type Props = {
  layer: string;
  object: Record<string, unknown>;
  onClose: () => void;
};

const SKIP_KEYS = new Set(['raw', 'id', 'ingestedAt', 'seededAt', 'computedAt']);

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '\u2014';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.length === 0 ? '[]' : value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toUpperCase();
}

export function MapDetailPanel({ layer, object, onClose }: Props) {
  const entries = Object.entries(object)
    .filter(([key]) => !SKIP_KEYS.has(key))
    .filter(([, value]) => value !== null && value !== undefined && value !== '');

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <span className="detail-provider">{layer.toUpperCase()}</span>
        <button className="detail-close" onClick={onClose}>&#x2715;</button>
      </div>

      <div className="detail-title">
        {String(object.name || object.title || object.callsign || object.shipName || object.eventId || object.id || 'Feature')}
      </div>

      <div className="detail-fields">
        {entries.map(([key, value]) => (
          <div key={key} className="detail-row">
            <span className="detail-key">{formatKey(key)}</span>
            <span className="detail-value">{formatValue(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
