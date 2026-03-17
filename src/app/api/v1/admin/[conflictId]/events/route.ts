import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminEventCreateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { checkEventEnforcement } from '@/server/lib/enforcement';
import { enforcementResponse, isEnforcementMode } from '@/server/lib/enforcement-utils';
import { upsertEventDocument } from '@/server/lib/rag/indexer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminEventCreateSchema);
  if (body instanceof NextResponse) return body;
  const ts = new Date(body.timestamp);

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  // Enforcement dry-run (no DB write)
  if (isEnforcementMode(req)) {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentEvents = await prisma.intelEvent.findMany({
      where: { conflictId, timestamp: { gte: twoDaysAgo } },
      select: { title: true, timestamp: true },
    });
    const issues = checkEventEnforcement(body, {
      recentEvents: recentEvents.map(e => ({ title: e.title, timestamp: e.timestamp.toISOString() })),
    });
    return enforcementResponse(body, issues);
  }

  const existing = await prisma.intelEvent.findUnique({ where: { id: body.id } });
  if (existing) return err('DUPLICATE', `Event ${body.id} already exists`, 409);

  // Validate actor FK refs
  if (body.actorResponses?.length) {
    const actorIds = body.actorResponses.map((r: { actorId: string }) => r.actorId);
    const actors = await prisma.actor.findMany({
      where: { id: { in: actorIds }, conflictId },
      select: { id: true },
    });
    const foundIds = new Set(actors.map(a => a.id));
    const missing = actorIds.filter((id: string) => !foundIds.has(id));
    if (missing.length) return err('VALIDATION', `Unknown actor IDs: ${missing.join(', ')}`);
  }

  const event = await prisma.intelEvent.create({
    data: {
      id: body.id,
      conflictId,
      timestamp: ts,
      severity: body.severity,
      type: body.type,
      title: body.title,
      location: body.location,
      summary: body.summary,
      fullContent: body.fullContent,
      verified: body.verified ?? false,
      tags: body.tags ?? [],
      sources: body.sources?.length
        ? {
            create: body.sources.map((s: { name: string; tier: number; reliability: number; url?: string }) => ({
              name: s.name,
              tier: s.tier,
              reliability: s.reliability,
              url: s.url ?? null,
            })),
          }
        : undefined,
      actorResponses: body.actorResponses?.length
        ? {
            create: body.actorResponses.map(
              (r) => ({
                actorId: r.actorId,
                actorName: r.actorName,
                stance: r.stance,
                type: r.type,
                statement: r.statement,
              }),
            ),
          }
        : undefined,
    },
    include: { sources: true, actorResponses: true },
  });

  await upsertEventDocument(conflictId, event.id);

  return ok({ id: event.id, created: true });
}
