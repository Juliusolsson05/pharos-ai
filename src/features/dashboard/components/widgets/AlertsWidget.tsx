'use client';

import { useActiveAlerts, type Alert } from '@/features/dashboard/queries/engine';
import { api } from '@/shared/lib/query/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query/keys';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'var(--danger)',
  High:     'var(--warning)',
  Medium:   'var(--info)',
  Low:      'var(--t3)',
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function AlertRow({ alert, onAck }: { alert: Alert; onAck: (id: string) => void }) {
  const color = SEVERITY_COLORS[alert.severity] ?? 'var(--t3)';
  return (
    <div
      className="flex items-start gap-2 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)]"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="mono text-[8px] font-bold tracking-[0.08em] px-1 py-px"
            style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
          >
            {alert.severity.toUpperCase()}
          </span>
          <span className="mono text-[8px] text-[var(--t4)]">{alert.ruleId}</span>
          <span className="mono text-[8px] text-[var(--t4)] ml-auto shrink-0">
            {timeAgo(alert.timestamp)}
          </span>
        </div>
        <p className="text-[11px] text-[var(--t1)] leading-snug">{alert.message}</p>
      </div>
      <button
        onClick={() => onAck(alert.id)}
        className="shrink-0 px-1.5 py-0.5 text-[8px] mono font-bold tracking-wide text-[var(--t4)] hover:text-[var(--t1)] bg-[var(--bg-3)] border border-[var(--bd)] hover:border-[var(--blue)] transition-colors"
        title="Acknowledge"
      >
        ACK
      </button>
    </div>
  );
}

export function AlertsWidget() {
  const { data: alertData, isLoading } = useActiveAlerts();
  const queryClient = useQueryClient();

  const ackMutation = useMutation({
    mutationFn: (alertId: string) =>
      api.post(`/engine/alerts/${alertId}/ack`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engine.alerts() });
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[10px] text-[var(--t4)]">LOADING ALERTS...</span>
      </div>
    );
  }

  const alerts = alertData?.alerts ?? [];

  return (
    <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="label text-[8px] text-[var(--t4)]">PHAROS ENGINE // ACTIVE ALERTS</span>
        {alerts.length > 0 && (
          <span
            className="mono text-[9px] font-bold px-1.5 py-px"
            style={{
              color: 'var(--danger)',
              backgroundColor: 'color-mix(in srgb, var(--danger) 15%, transparent)',
            }}
          >
            {alerts.length} ACTIVE
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-3 h-3 rounded-full bg-[var(--success)] mx-auto mb-2 animate-pulse" />
            <span className="mono text-[10px] text-[var(--t3)]">NO ACTIVE ALERTS</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onAck={(id) => ackMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
