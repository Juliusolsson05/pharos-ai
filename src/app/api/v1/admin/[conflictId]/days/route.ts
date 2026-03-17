import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminDaySnapshotCreateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { checkDaySnapshotEnforcement } from '@/server/lib/enforcement';
import { enforcementResponse, isEnforcementMode } from '@/server/lib/enforcement-utils';
import { upsertSnapshotDocument } from '@/server/lib/rag/indexer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminDaySnapshotCreateSchema);
  if (body instanceof NextResponse) return body;

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const day = new Date(body.day + 'T00:00:00Z');

  // Enforcement dry-run
  if (isEnforcementMode(req)) {
    const issues = checkDaySnapshotEnforcement(body);
    return enforcementResponse(body, issues);
  }

  // Check for duplicate
  const existing = await prisma.conflictDaySnapshot.findUnique({
    where: { conflictId_day: { conflictId, day } },
  });
  if (existing) return err('DUPLICATE', `Day snapshot for ${body.day} already exists`, 409);

  const snapshot = await prisma.$transaction(async (tx) => {
    const snap = await tx.conflictDaySnapshot.create({
      data: {
        conflictId,
        day,
        dayLabel: body.dayLabel,
        summary: body.summary,
        keyFacts: body.keyFacts ?? [],
        escalation: body.escalation,
        economicNarrative: body.economicNarrative ?? '',
      },
    });

    // Create related records
    if (body.casualties?.length) {
      await tx.casualtySummary.createMany({
        data: body.casualties.map(
          (c: { faction: string; killed?: number; wounded?: number; civilians?: number | boolean; injured?: number }) => ({
            snapshotId: snap.id,
            faction: c.faction,
            killed: c.killed ?? 0,
            wounded: c.wounded ?? 0,
            civilians: typeof c.civilians === 'boolean' ? (c.civilians ? 1 : 0) : (c.civilians ?? 0),
            injured: c.injured ?? 0,
          }),
        ),
      });
    }

    if (body.economicChips?.length) {
      await tx.economicImpactChip.createMany({
        data: body.economicChips.map(
          (c: { label: string; val: string; sub: string; color: string }, i: number) => ({
            snapshotId: snap.id,
            ord: i,
            label: c.label,
            val: c.val,
            sub: c.sub,
            color: c.color,
          }),
        ),
      });
    }

    if (body.scenarios?.length) {
      await tx.scenario.createMany({
        data: body.scenarios.map(
          (s: { label: string; subtitle: string; color: string; prob: string; body: string }, i: number) => ({
            snapshotId: snap.id,
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

    return snap;
  });

  await upsertSnapshotDocument(conflictId, snapshot.id);

  return ok({ id: snapshot.id, day: body.day, created: true });
}
