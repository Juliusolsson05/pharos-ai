import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { ok } from '@/server/lib/api-utils';
import { validateLeadershipBatch } from '@/server/lib/leadership';
import { leadershipBatchUpsertSchema } from '@/server/lib/leadership-schemas';

export async function POST(req: NextRequest, { params }: { params: Promise<{ conflictId: string; actorId: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId } = await params;
  const body = await parseBodyWithSchema(req, leadershipBatchUpsertSchema);
  if (body instanceof Response) return body;

  const issues = await validateLeadershipBatch(conflictId, actorId, body);
  return ok({ valid: issues.length === 0, issues });
}
