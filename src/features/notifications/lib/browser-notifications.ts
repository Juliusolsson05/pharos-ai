'use client';

const SW_PATH = '/pharos-notifications-sw.js';
const CHANNEL_NAME = 'pharos-notifications';

export function getNotificationSupport() {
  if (typeof window === 'undefined') return 'unsupported' as const;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported' as const;
  return 'supported' as const;
}

export async function registerNotificationWorker() {
  if (getNotificationSupport() !== 'supported') return null;

  await navigator.serviceWorker.register(SW_PATH);

  return navigator.serviceWorker.ready;
}

export async function requestNotificationPermission() {
  if (getNotificationSupport() !== 'supported') return 'unsupported' as const;
  return Notification.requestPermission();
}

export async function showSystemNotification(options: {
  body: string;
  eventId: string;
  registration: ServiceWorkerRegistration | null;
  url: string;
  title: string;
}) {
  if (!options.registration || Notification.permission !== 'granted') return false;

  await options.registration.showNotification(options.title, {
    body: options.body,
    data: {
      eventId: options.eventId,
      url: options.url,
    },
    icon: '/logo.svg',
    requireInteraction: true,
    tag: `event:${options.eventId}`,
  });

  return true;
}

export function createNotificationChannel(onMessage: (eventId: string) => void) {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = event => {
    const eventId = event.data?.eventId;
    if (typeof eventId === 'string') {
      onMessage(eventId);
    }
  };

  return channel;
}

export function broadcastNotification(channel: BroadcastChannel | null, eventId: string) {
  channel?.postMessage({ eventId });
}
