/**
 * map-tooltip.ts
 * DeckGL tooltip HTML generator.
 *
 * CODEX §5.4 exception: DeckGL requires raw HTML strings for tooltips.
 * All colours reference CSS variables — zero hex literals allowed.
 */

import type { PickingInfo } from '@deck.gl/core';

import type { Asset, MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { ActorMeta } from '@/data/map-tokens';
import { STATUS_META, type MarkerStatus } from '@/data/map-tokens';

const FALLBACK_STATUS = { label: 'Unknown', cssVar: 'var(--t4)' } as const;
function safeStatus(status: string | null | undefined) {
  if (!status) return FALLBACK_STATUS;
  return STATUS_META[status as MarkerStatus] ?? FALLBACK_STATUS;
}

// Inline timestamp formatter (no import to keep file pure .ts)

function fmtTs(ts: string | undefined): string {
  if (!ts) return '';
  const d = new Date(ts);
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const day   = String(d.getUTCDate()).padStart(2, '0');
  const time  = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
  return `${month} ${day} · ${time} UTC`;
}

const FALLBACK_META: ActorMeta = {
  label: '??', cssVar: 'var(--t3)', rgb: [143, 153, 168],
  affiliation: 'NEUTRAL', group: 'Unknown',
};

// Shared wrapper

function wrap(inner: string) {
  return {
    html: `<div style="background:var(--bg-app);border:1px solid var(--bd);padding:8px 10px;font-family:'SFMono-Regular',Menlo,monospace;max-width:260px;border-radius:2px">${inner}</div>`,
    style: { backgroundColor: 'transparent', border: 'none', padding: '0' },
  };
}

function pill(label: string, color: string) {
  return `<span style="background:color-mix(in srgb,${color} 14%,transparent);border:1px solid color-mix(in srgb,${color} 35%,transparent);color:${color};font-size:8px;padding:1px 5px;border-radius:2px;margin-right:3px">${label}</span>`;
}

// Factory

export function createBuildTooltip(am: Record<string, ActorMeta>) {
  const meta = (key: string) => am[key] ?? FALLBACK_META;

  function strikeTooltip(d: StrikeArc): string {
    const m = meta(d.actor);
    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)';
    const ts = fmtTs(d.timestamp);
    return `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:5px">${d.label}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:4px">${pill(m.label, m.cssVar)}${pill(d.type.replace('_', ' '), m.cssVar)}${pill(d.severity, sevColor)}</div>
      <div style="font-size:10px;color:var(--t3)">STATUS: <span style="color:${safeStatus(d.status).cssVar}">${safeStatus(d.status).label}</span></div>
    `;
  }

  function missileTooltip(d: MissileTrack): string {
    const m = meta(d.actor);
    const statusColor = d.status === 'INTERCEPTED' ? 'var(--warning)' : 'var(--danger)';
    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)';
    const ts = fmtTs(d.timestamp);
    return `
      <div style="font-weight:700;font-size:11px;color:var(--danger);margin-bottom:5px">${d.label}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:4px">${pill(m.label, m.cssVar)}${pill(d.type, m.cssVar)}${pill(d.severity, sevColor)}</div>
      <div style="font-size:10px;color:${statusColor};font-weight:700">▶ ${d.status}</div>
    `;
  }

  function targetTooltip(d: Target): string {
    const m = meta(d.actor);
    const sm = safeStatus(d.status);
    const ts = fmtTs(d.timestamp);
    return `
      <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:5px">${d.name}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:6px">${pill(m.label, m.cssVar)}${pill(d.type.replace('_', ' '), m.cssVar)}${pill(sm.label, sm.cssVar)}</div>
      <div style="color:var(--t2);font-size:10px;line-height:1.5">${d.description}</div>
    `;
  }

  function assetTooltip(d: Asset): string {
    const m = meta(d.actor);
    const sm = safeStatus(d.status);
    const extra = d.type === 'CARRIER'
      ? `<div style="color:var(--warning);font-size:10px;margin-top:4px;font-weight:700">▶ CARRIER STRIKE GROUP</div>`
      : '';
    return `
      <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:6px">${d.name}</div>
      <div style="margin-bottom:4px">${pill(m.label, m.cssVar)}${pill(d.type.replace('_', ' '), 'var(--t3)')}${pill(sm.label, sm.cssVar)}</div>
      ${d.description ? `<div style="color:var(--t2);font-size:10px;line-height:1.5;margin-top:4px">${d.description}</div>` : ''}
      ${extra}
    `;
  }

  function zoneTooltip(d: ThreatZone): string {
    const m = meta(d.actor);
    return `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:4px">${d.name}</div>
      <div>${pill(m.label, m.cssVar)}${pill(d.type.replace('_', ' '), 'var(--warning)')}</div>
    `;
  }

  return function buildTooltip(info: PickingInfo): ReturnType<typeof wrap> | null {
    const { object, layer } = info;
    if (!object || !layer) return null;

    const id = layer.id;
    if (id === 'strikes')      return wrap(strikeTooltip(object as StrikeArc));
    if (id === 'missiles')     return wrap(missileTooltip(object as MissileTrack));
    if (id === 'targets' || id === 'target-labels') return wrap(targetTooltip(object as Target));
    if (id === 'assets'  || id === 'asset-labels')  return wrap(assetTooltip(object as Asset));
    if (id === 'zones')        return wrap(zoneTooltip(object as ThreatZone));
    return null;
  };
}
