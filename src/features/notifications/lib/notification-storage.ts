'use client';

import { hasPreferencesConsent } from '@/shared/lib/analytics/consent';

export const NOTIFICATION_PREFS_KEY = 'pharos:notifications:v1';

export type NotificationSeverity = 'CRITICAL' | 'HIGH' | 'STANDARD';
export type NotificationPermissionState = NotificationPermission | 'unsupported';

export type NotificationPrefs = {
  version: 1;
  enabled: boolean;
  playSound: boolean;
  permission: NotificationPermissionState;
  minSeverity: NotificationSeverity;
  lastSeenCreatedAt?: string;
  lastSeenId?: string;
  recentNotifiedIds: string[];
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  version: 1,
  enabled: false,
  playSound: true,
  permission: 'default',
  minSeverity: 'HIGH',
  recentNotifiedIds: [],
};

export function readNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  try {
    return parseNotificationPrefs(window.localStorage.getItem(NOTIFICATION_PREFS_KEY));
  } catch {
    return resolvePermission(DEFAULT_NOTIFICATION_PREFS);
  }
}

export function parseNotificationPrefs(raw: string | null): NotificationPrefs {
  if (!raw) return resolvePermission(DEFAULT_NOTIFICATION_PREFS);

  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return resolvePermission({
      ...DEFAULT_NOTIFICATION_PREFS,
      enabled: parsed.enabled === true,
      playSound: parsed.playSound !== false,
      minSeverity: isSeverity(parsed.minSeverity) ? parsed.minSeverity : DEFAULT_NOTIFICATION_PREFS.minSeverity,
      lastSeenCreatedAt: typeof parsed.lastSeenCreatedAt === 'string' ? parsed.lastSeenCreatedAt : undefined,
      lastSeenId: typeof parsed.lastSeenId === 'string' ? parsed.lastSeenId : undefined,
      recentNotifiedIds: Array.isArray(parsed.recentNotifiedIds)
        ? parsed.recentNotifiedIds.filter((value): value is string => typeof value === 'string').slice(-20)
        : [],
    });
  } catch {
    return resolvePermission(DEFAULT_NOTIFICATION_PREFS);
  }
}

export function writeNotificationPrefs(next: NotificationPrefs) {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) return;

  window.localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('pharos-notification-prefs-changed'));
}

export function patchNotificationPrefs(patch: Partial<NotificationPrefs>) {
  const current = readNotificationPrefs();
  writeNotificationPrefs(resolvePermission({
    ...current,
    ...patch,
    recentNotifiedIds: patch.recentNotifiedIds ?? current.recentNotifiedIds,
  }));
}

export function subscribeToNotificationPrefs(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener('pharos-notification-prefs-changed', handleChange);
  window.addEventListener('pharos-cookie-consent-changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('pharos-notification-prefs-changed', handleChange);
    window.removeEventListener('pharos-cookie-consent-changed', handleChange);
  };
}

export function getNotificationPrefsSnapshot() {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) return null;
  return window.localStorage.getItem(NOTIFICATION_PREFS_KEY);
}

export function getServerNotificationPrefsSnapshot() {
  return null;
}

function resolvePermission(prefs: NotificationPrefs): NotificationPrefs {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ...prefs, permission: 'unsupported' };
  }

  return { ...prefs, permission: window.Notification.permission };
}

function isSeverity(value: unknown): value is NotificationSeverity {
  return value === 'CRITICAL' || value === 'HIGH' || value === 'STANDARD';
}
