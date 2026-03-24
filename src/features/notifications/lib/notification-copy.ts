import type { EventNotificationCandidate } from '@/types/domain';

export function getNotificationTargetUrl(eventId: string) {
  return `/dashboard/feed?event=${eventId}`;
}

export function formatNotificationTitle(event: EventNotificationCandidate) {
  return `${event.severity} - ${event.title}`;
}

export function formatNotificationBody(event: EventNotificationCandidate) {
  return `${event.location} - ${event.summary}`;
}
