import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { err, ok } from '@/server/lib/api-utils';
import { getLeadershipTree } from '@/server/lib/leadership';

export async function GET(req: NextRequest, { params }: { params: Promise<{ conflictId: string; actorId: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId } = await params;
  const tree = await getLeadershipTree(conflictId, actorId);
  if (!tree) return err('NOT_FOUND', `Leadership tree for actor ${actorId} not found`, 404);
  return ok(tree);
}
