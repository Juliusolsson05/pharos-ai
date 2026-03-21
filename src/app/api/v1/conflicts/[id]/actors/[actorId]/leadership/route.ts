import { err, ok } from '@/server/lib/api-utils';
import { getLeadershipTree } from '@/server/lib/leadership';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; actorId: string }> }) {
  const { id, actorId } = await params;
  const tree = await getLeadershipTree(id, actorId);
  if (!tree) return err('NOT_FOUND', `Leadership tree for actor ${actorId} not found`, 404);

  return ok(tree, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  });
}
