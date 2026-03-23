'use client';

import { useNotificationMonitor } from '@/features/notifications/hooks/use-notification-monitor';

export function NotificationRuntime() {
  useNotificationMonitor();

  return null;
}
