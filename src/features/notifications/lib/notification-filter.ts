import type { EventNotificationCandidate } from '@/types/domain';

import type { NotificationPrefs } from './notification-storage';

const SEVERITY_ORDER: Record<EventNotificationCandidate['severity'], number> = {
  CRITICAL: 3,
  HIGH: 2,
  STANDARD: 1,
};

const MAX_NOTIFICATION_EVENT_AGE_MS = 24 * 60 * 60 * 1000;

export function shouldNotifyEvent(event: EventNotificationCandidate, prefs: NotificationPrefs) {
  if (!prefs.enabled) return false;
  if (prefs.recentNotifiedIds.includes(event.id)) return false;
  if (event.sourceCount < 1) return false;
  if (Date.now() - new Date(event.timestamp).getTime() > MAX_NOTIFICATION_EVENT_AGE_MS) return false;

  return SEVERITY_ORDER[event.severity] >= SEVERITY_ORDER[prefs.minSeverity];
}

export function mergeRecentIds(recentIds: string[], nextId: string) {
  return [...new Set([...recentIds, nextId])].slice(-20);
}
