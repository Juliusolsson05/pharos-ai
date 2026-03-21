import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { err, ok } from '@/server/lib/api-utils';
import { upsertLeadershipBatch, validateLeadershipBatch } from '@/server/lib/leadership';
import { leadershipBatchUpsertSchema } from '@/server/lib/leadership-schemas';

export async function POST(req: NextRequest, { params }: { params: Promise<{ conflictId: string; actorId: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId } = await params;
  const body = await parseBodyWithSchema(req, leadershipBatchUpsertSchema);
  if (body instanceof Response) return body;

  const issues = await validateLeadershipBatch(conflictId, actorId, body);
  if (issues.length > 0) return err('VALIDATION', issues.join('; '), 422);

  await upsertLeadershipBatch(conflictId, actorId, body);
  return ok({ actorId, updated: true });
}
