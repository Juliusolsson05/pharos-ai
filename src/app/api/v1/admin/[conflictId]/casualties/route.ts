import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminCasualtiesUpsertSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { syncSnapshotDocumentForDay } from '@/server/lib/rag/snapshot-sync';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminCasualtiesUpsertSchema);
  if (body instanceof NextResponse) return body;

  const day = new Date(body.day + 'T00:00:00Z');

  const snapshot = await prisma.conflictDaySnapshot.findUnique({
    where: { conflictId_day: { conflictId, day } },
  });
  if (!snapshot) return err('NOT_FOUND', `Day snapshot for ${body.day} not found — create the day first`, 404);

  await prisma.$transaction(async (tx) => {
    await tx.casualtySummary.deleteMany({ where: { snapshotId: snapshot.id } });
    await tx.casualtySummary.createMany({
      data: body.casualties.map((c) => ({
        snapshotId: snapshot.id,
        faction: c.faction,
        killed: c.killed ?? 0,
        wounded: c.wounded ?? 0,
        civilians: c.civilians ?? 0,
        injured: c.injured ?? 0,
      })),
    });
  });

  await syncSnapshotDocumentForDay(conflictId, day);

  return ok({ day: body.day, upserted: body.casualties.length });
}
