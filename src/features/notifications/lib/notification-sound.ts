'use client';

const NOTIFICATION_SOUND_PATH = '/sounds/notification.mp3';

let notificationAudio: HTMLAudioElement | null = null;

export function playNotificationSound() {
  if (typeof window === 'undefined') return false;

  try {
    if (!notificationAudio) {
      notificationAudio = new Audio(NOTIFICATION_SOUND_PATH);
      notificationAudio.preload = 'auto';
    }

    notificationAudio.currentTime = 0;
    void notificationAudio.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
}
