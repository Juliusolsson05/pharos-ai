import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema, parseDayParam } from '@/server/lib/admin-schema-utils';
import { adminDaySnapshotUpdateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { syncSnapshotDocumentForDay } from '@/server/lib/rag/snapshot-sync';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; day: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, day: dayStr } = await params;
  const body = await parseBodyWithSchema(req, adminDaySnapshotUpdateSchema);
  if (body instanceof NextResponse) return body;

  const day = parseDayParam(dayStr);
  if (!day) return err('VALIDATION', 'Invalid day format', 422);

  const snapshot = await prisma.conflictDaySnapshot.findUnique({
    where: { conflictId_day: { conflictId, day } },
  });
  if (!snapshot) return err('NOT_FOUND', `Day snapshot for ${dayStr} not found`, 404);

  await prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {};
    if (body.dayLabel !== undefined) data.dayLabel = body.dayLabel;
    if (body.summary !== undefined) data.summary = body.summary;
    if (body.keyFacts !== undefined) data.keyFacts = body.keyFacts;
    if (body.escalation !== undefined) data.escalation = body.escalation;
    if (body.economicNarrative !== undefined) data.economicNarrative = body.economicNarrative;

    if (Object.keys(data).length > 0) {
      await tx.conflictDaySnapshot.update({ where: { id: snapshot.id }, data });
    }

    // Replace casualties if provided
    if (body.casualties !== undefined) {
      await tx.casualtySummary.deleteMany({ where: { snapshotId: snapshot.id } });
      if (body.casualties.length) {
        await tx.casualtySummary.createMany({
          data: body.casualties.map(
            (c: { faction: string; killed?: number; wounded?: number; civilians?: number | boolean; injured?: number }) => ({
              snapshotId: snapshot.id,
              faction: c.faction,
              killed: c.killed ?? 0,
              wounded: c.wounded ?? 0,
              civilians: typeof c.civilians === 'boolean' ? (c.civilians ? 1 : 0) : (c.civilians ?? 0),
              injured: c.injured ?? 0,
            }),
          ),
        });
      }
    }

    // Replace economic chips if provided
    if (body.economicChips !== undefined) {
      await tx.economicImpactChip.deleteMany({ where: { snapshotId: snapshot.id } });
      if (body.economicChips.length) {
        await tx.economicImpactChip.createMany({
          data: body.economicChips.map(
            (c: { label: string; val: string; sub: string; color: string }, i: number) => ({
              snapshotId: snapshot.id,
              ord: i,
              label: c.label,
              val: c.val,
              sub: c.sub,
              color: c.color,
            }),
          ),
        });
      }
    }

    // Replace scenarios if provided
    if (body.scenarios !== undefined) {
      await tx.scenario.deleteMany({ where: { snapshotId: snapshot.id } });
      if (body.scenarios.length) {
        await tx.scenario.createMany({
          data: body.scenarios.map(
            (s: { label: string; subtitle: string; color: string; prob: string; body: string }, i: number) => ({
              snapshotId: snapshot.id,
              ord: i,
              label: s.label,
              subtitle: s.subtitle,
              color: s.color,
              prob: s.prob,
              body: s.body,
            }),
          ),
        });
      }
    }
  });

  await syncSnapshotDocumentForDay(conflictId, day);

  return ok({ id: snapshot.id, day: dayStr, updated: true });
}
