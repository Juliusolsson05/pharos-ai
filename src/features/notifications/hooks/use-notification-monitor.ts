'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { toast } from 'sonner';

import { useEventNotifications } from '@/features/events/queries/notifications';

import { publicConflictId } from '@/shared/lib/env';

import type { EventNotificationCandidate } from '@/types/domain';

import {
  broadcastNotification,
  createNotificationChannel,
  registerNotificationWorker,
  showSystemNotification,
} from '../lib/browser-notifications';
import {
  formatNotificationBody,
  formatNotificationTitle,
  getNotificationTargetUrl,
} from '../lib/notification-copy';
import { mergeRecentIds, shouldNotifyEvent } from '../lib/notification-filter';
import { playNotificationSound } from '../lib/notification-sound';
import {
  getNotificationPrefsSnapshot,
  getServerNotificationPrefsSnapshot,
  type NotificationPrefs,
  parseNotificationPrefs,
  patchNotificationPrefs,
  subscribeToNotificationPrefs,
} from '../lib/notification-storage';

export function useNotificationMonitor() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const prefsSnapshot = useSyncExternalStore(
    subscribeToNotificationPrefs,
    getNotificationPrefsSnapshot,
    getServerNotificationPrefsSnapshot,
  );
  const prefs = parseNotificationPrefs(prefsSnapshot);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const prevEnabledRef = useRef(prefs.enabled);
  const conflictId = publicConflictId;

  const { data: events = [] } = useEventNotifications(conflictId, {
    createdAt: prefs.lastSeenCreatedAt,
    id: prefs.lastSeenId,
  }, prefs.enabled);

  useEffect(() => {
    if (!prefs.enabled) return;

    void registerNotificationWorker().then(setRegistration).catch(() => setRegistration(null));
  }, [prefs.enabled]);

  useEffect(() => {
    channelRef.current = createNotificationChannel(eventId => {
      seenIdsRef.current.add(eventId);
    });

    return () => {
      channelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (prefs.enabled && !prevEnabledRef.current) {
      patchNotificationPrefs({
        lastSeenCreatedAt: new Date().toISOString(),
        lastSeenId: undefined,
      });
    }

    prevEnabledRef.current = prefs.enabled;
  }, [prefs.enabled]);

  useEffect(() => {
    if (!prefs.enabled || events.length === 0) return;

    if (!prefs.lastSeenCreatedAt) {
      const latest = events[events.length - 1];
      patchNotificationPrefs({ lastSeenCreatedAt: latest?.createdAt, lastSeenId: latest?.id });
      return;
    }

    void notifyForEvents(events, prefs, registration, seenIdsRef.current, channelRef.current);
  }, [events, prefs, registration]);
}

async function notifyForEvents(
  events: EventNotificationCandidate[],
  prefs: NotificationPrefs,
  registration: ServiceWorkerRegistration | null,
  seenIds: Set<string>,
  channel: BroadcastChannel | null,
) {
  let latestSeen = prefs.lastSeenCreatedAt;
  let latestSeenId = prefs.lastSeenId;
  let recentIds = prefs.recentNotifiedIds;

  for (const event of events) {
    if (!shouldNotifyEvent(event, { ...prefs, recentNotifiedIds: recentIds })) {
      latestSeen = event.createdAt;
      latestSeenId = event.id;
      continue;
    }
    if (seenIds.has(event.id)) {
      latestSeen = event.createdAt;
      latestSeenId = event.id;
      continue;
    }

    const visible = typeof document !== 'undefined' && document.visibilityState === 'visible';
    const targetUrl = getNotificationTargetUrl(event.id);
    const title = formatNotificationTitle(event);
    const body = formatNotificationBody(event);

    let delivered = false;

    if (visible) {
      toast(title, {
        action: {
          label: 'Open',
          onClick: () => {
            window.location.assign(targetUrl);
          },
        },
        description: body,
      });
      delivered = true;
    } else {
      delivered = await showSystemNotification({
        body,
        eventId: event.id,
        registration,
        title,
        url: targetUrl,
      });
    }

    if (!delivered) continue;

    if (prefs.playSound && delivered) {
      playNotificationSound();
    }

    seenIds.add(event.id);
    broadcastNotification(channel, event.id);
    recentIds = mergeRecentIds(recentIds, event.id);
    latestSeen = event.createdAt;
    latestSeenId = event.id;
  }

  patchNotificationPrefs({
    lastSeenCreatedAt: latestSeen,
    lastSeenId: latestSeenId,
    recentNotifiedIds: recentIds,
  });
}
