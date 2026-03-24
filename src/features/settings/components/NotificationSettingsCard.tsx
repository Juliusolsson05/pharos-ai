'use client';

import { useState, useSyncExternalStore } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import {
  registerNotificationWorker,
  requestNotificationPermission,
  showSystemNotification,
} from '@/features/notifications/lib/browser-notifications';
import { playNotificationSound } from '@/features/notifications/lib/notification-sound';
import {
  getNotificationPrefsSnapshot,
  getServerNotificationPrefsSnapshot,
  type NotificationSeverity,
  parseNotificationPrefs,
  patchNotificationPrefs,
  subscribeToNotificationPrefs,
} from '@/features/notifications/lib/notification-storage';

import { hasPreferencesConsent } from '@/shared/lib/analytics/consent';

export function NotificationSettingsCard() {
  const prefsSnapshot = useSyncExternalStore(
    subscribeToNotificationPrefs,
    getNotificationPrefsSnapshot,
    getServerNotificationPrefsSnapshot,
  );
  const prefs = parseNotificationPrefs(prefsSnapshot);
  const canPersistPreferences = hasPreferencesConsent();
  const [isWorking, setIsWorking] = useState(false);

  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      patchNotificationPrefs({ enabled: false });
      return;
    }

    if (!canPersistPreferences) return;

    setIsWorking(true);
    const permission = await requestNotificationPermission();
    patchNotificationPrefs({
      enabled: permission === 'granted',
      permission,
    });
    setIsWorking(false);
  };

  const sendTestNotification = async () => {
    setIsWorking(true);
    try {
      const registration = await registerNotificationWorker();
      const delivered = await showSystemNotification({
        body: 'This is a test notification from Pharos.',
        eventId: 'test-notification',
        registration,
        title: 'Pharos notifications enabled',
        url: '/dashboard/settings',
      });

      const playedSound = delivered && prefs.playSound ? playNotificationSound() : false;

      if (delivered) {
        toast.success('Test notification sent', {
          description: playedSound
            ? 'You should hear the sound and see a browser notification now.'
            : 'You should see a browser notification now.',
        });
      } else {
        toast.error('Test notification failed', {
          description: 'Check browser notification permission and service worker registration.',
        });
      }
    } catch {
      toast.error('Test notification failed', {
        description: 'The browser could not create a system notification.',
      });
    }

    setIsWorking(false);
  };

  return (
    <Card className="border-[var(--bd)] bg-[var(--bg-1)] py-0 shadow-none">
      <CardHeader className="border-b border-[var(--bd)] px-5 py-4">
        <CardTitle className="text-[var(--t1)]">Browser notifications</CardTitle>
        <CardDescription className="text-[var(--t3)]">
          In this first version, alerts arrive while Pharos is open in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[var(--t1)]">Enable notifications</span>
            <span className="text-sm text-[var(--t3)]">
              Visible dashboard tabs show in-app alerts. Hidden tabs show system notifications.
            </span>
          </div>
          <Switch
            checked={prefs.enabled}
            disabled={!canPersistPreferences || prefs.permission === 'unsupported' || isWorking}
            onCheckedChange={toggleNotifications}
            aria-label="Enable browser notifications"
            className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[var(--t1)]">Play notification sound</span>
            <span className="text-sm text-[var(--t3)]">
              Plays a short alert sound when a new notification is delivered while Pharos is open.
            </span>
          </div>
          <Switch
            checked={prefs.playSound}
            disabled={!canPersistPreferences || !prefs.enabled || isWorking}
            onCheckedChange={value => patchNotificationPrefs({ playSound: value })}
            aria-label="Play notification sound"
            className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t4)]">Permission</span>
            <span className="mono rounded border border-[var(--bd)] bg-[var(--bg-2)] px-3 py-2 text-[length:var(--text-body-sm)] text-[var(--t2)]">
              {prefs.permission.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t4)]">Severity threshold</span>
            <Select
              value={prefs.minSeverity}
              disabled={!canPersistPreferences}
              onValueChange={value => patchNotificationPrefs({ minSeverity: value as NotificationSeverity })}
            >
              <SelectTrigger className="w-full border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t1)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[var(--bd)] bg-[var(--bg-1)] text-[var(--t1)]">
                <SelectItem className="focus:bg-[var(--bg-3)] focus:text-[var(--t1)]" value="CRITICAL">Critical only</SelectItem>
                <SelectItem className="focus:bg-[var(--bg-3)] focus:text-[var(--t1)]" value="HIGH">High + Critical</SelectItem>
                <SelectItem className="focus:bg-[var(--bg-3)] focus:text-[var(--t1)]" value="STANDARD">All new events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t1)] hover:bg-[var(--bg-3)]"
            onClick={sendTestNotification}
            disabled={!canPersistPreferences || prefs.permission !== 'granted' || isWorking}
          >
            Test notification
          </Button>
          <span className="text-xs text-[var(--t4)]">
            {!canPersistPreferences
              ? 'Notifications require preference storage to be enabled in this browser.'
              : 'If permission is denied, enable notifications again through your browser settings.'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
