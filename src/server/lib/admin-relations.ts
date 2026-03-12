import { prisma } from '@/server/lib/db';

export async function validateOptionalEventId(conflictId: string, eventId?: string | null) {
  if (!eventId) return null;

  const event = await prisma.intelEvent.findFirst({
    where: { id: eventId, conflictId },
    select: { id: true },
  });

  if (!event) return `Event ${eventId} not found`;
  return null;
}

export async function validateOptionalEventIds(conflictId: string, eventIds?: string[] | null) {
  if (!eventIds || eventIds.length === 0) return null;

  const found = await prisma.intelEvent.findMany({
    where: { conflictId, id: { in: eventIds } },
    select: { id: true },
  });
  const foundIds = new Set(found.map(event => event.id));
  const missing = eventIds.filter(eventId => !foundIds.has(eventId));

  if (missing.length > 0) return `Unknown event IDs: ${missing.join(', ')}`;
  return null;
}
