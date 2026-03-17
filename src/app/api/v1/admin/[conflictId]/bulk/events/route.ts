import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminBulkEventsSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertEventDocument } from '@/server/lib/rag/indexer';

import { EventType, Severity } from '@/generated/prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminBulkEventsSchema);
  if (body instanceof NextResponse) return body;

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const ids = body.events.map((e) => e.id);
  const existing = await prisma.intelEvent.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  if (existing.length > 0) {
    const dupes = existing.map((e) => e.id);
    return err('DUPLICATE', `Events already exist: ${dupes.join(', ')}`, 409);
  }

  const created: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const item of body.events) {
      await tx.intelEvent.create({
        data: {
          id: item.id,
          conflictId,
          timestamp: new Date(item.timestamp),
          severity: item.severity as Severity,
          type: item.type as EventType,
          title: item.title,
          location: item.location,
          summary: item.summary,
          fullContent: item.fullContent,
          verified: item.verified ?? false,
          tags: item.tags ?? [],
          sources: item.sources?.length
            ? {
                create: item.sources.map((s) => ({
                  name: s.name,
                  tier: s.tier,
                  reliability: s.reliability,
                  url: s.url ?? null,
                })),
              }
            : undefined,
          actorResponses: item.actorResponses?.length
            ? {
                create: item.actorResponses.map((response) => ({
                  actorId: response.actorId,
                  actorName: response.actorName,
                  stance: response.stance,
                  type: response.type,
                  statement: response.statement,
                })),
              }
            : undefined,
        },
      });
      created.push(item.id);
    }
  });

  await Promise.all(created.map((id) => upsertEventDocument(conflictId, id)));

  return ok({ created, errors: [] });
}
