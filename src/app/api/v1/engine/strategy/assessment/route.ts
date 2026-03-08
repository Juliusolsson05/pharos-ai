import { engineGet, forwardEngineResponse } from '@/server/lib/engine-proxy';

export async function GET() {
  const res = await engineGet('/api/v1/engine/strategy/assessment');
  return forwardEngineResponse(res);
}
