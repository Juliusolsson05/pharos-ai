'use client';
import React from 'react';

import { AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

import type { VerificationStatus } from '@/types/domain';

// Sub-components shared by PharosView

type EngStatProps = { icon: React.ReactNode; val: string };

export function EngStat({ icon, val }: EngStatProps) {
  return (
    <div className="flex items-center gap-1 text-[var(--t4)]">
      {icon}
      <span className="mono">{val}</span>
    </div>
  );
}

export function EmbedSkeleton() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="mono text-[length:var(--text-label)] text-[var(--t4)]">Loading embed…</div>
    </div>
  );
}

type VerificationBadgeProps = { status?: VerificationStatus };

export function VerificationBadge({ status }: VerificationBadgeProps) {
  if (!status || status === 'SKIPPED') return null;

  const config: Record<string, { icon: React.ReactNode; color: string; title: string }> = {
    VERIFIED: {
      icon: <ShieldCheck size={11} strokeWidth={2} />,
      color: 'var(--success)',
      title: 'Verified — confirmed real via X AI',
    },
    PARTIAL: {
      icon: <ShieldQuestion size={11} strokeWidth={2} />,
      color: 'var(--warning)',
      title: 'Partially corroborated',
    },
    FAILED: {
      icon: <ShieldAlert size={11} strokeWidth={2} />,
      color: 'var(--danger)',
      title: 'Verification failed — tweet not found or content mismatch',
    },
    UNVERIFIED: {
      icon: <HelpCircle size={10} strokeWidth={2} />,
      color: 'var(--t4)',
      title: 'Not yet verified',
    },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <span className="shrink-0 flex items-center" style={{ color: c.color }} title={c.title}>
      {c.icon}
    </span>
  );
}

type PharosNoteProps = { note: string };

export function PharosNote({ note }: PharosNoteProps) {
  const isWarning = note.startsWith('⚠️');
  const color     = isWarning ? 'var(--warning)' : 'var(--success)';
  const bg        = isWarning ? 'var(--warning-dim)' : 'var(--success-dim)';
  const border    = isWarning ? 'var(--warning-bd)' : 'var(--success-bd)';
  const text      = note.replace('⚠️ ', '');
  const Icon      = isWarning ? AlertTriangle : CheckCircle;

  return (
    <div
      className="mx-3 mt-2 mb-2.5 px-[10px] pt-2.5 pb-2"
      style={{ background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${color}` }}
    >
      <div className="flex gap-[7px] items-start">
        <Icon size={11} strokeWidth={2} className="shrink-0 mt-px" style={{ color }} />
        <div>
          <div className="label mb-0.5">Pharos Analyst Note</div>
          <p className="text-[length:var(--text-body-sm)] text-[var(--t2)] leading-normal">{text}</p>
        </div>
      </div>
    </div>
  );
}
