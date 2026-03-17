import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminEventSourcesSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertEventDocument } from '@/server/lib/rag/indexer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; eventId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, eventId } = await params;
  const body = await parseBodyWithSchema(req, adminEventSourcesSchema);
  if (body instanceof NextResponse) return body;

  const event = await prisma.intelEvent.findFirst({
    where: { id: eventId, conflictId },
  });
  if (!event) return err('NOT_FOUND', `Event ${eventId} not found`, 404);

  const created = await prisma.eventSource.createMany({
    data: body.sources.map((s) => ({
      eventId,
      name: s.name,
      tier: s.tier,
      reliability: s.reliability,
      url: s.url ?? null,
    })),
  });

  await upsertEventDocument(conflictId, eventId);

  return ok({ eventId, added: created.count });
}
