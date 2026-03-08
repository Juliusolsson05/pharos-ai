import { enginePost, forwardEngineResponse } from '@/server/lib/engine-proxy';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ alertId: string }> },
) {
  const { alertId } = await params;
  const res = await enginePost(`/api/v1/engine/alerts/${alertId}/ack`);
  return forwardEngineResponse(res);
}
