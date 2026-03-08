import { engineGet, forwardEngineResponse } from '@/server/lib/engine-proxy';

export async function GET() {
  const res = await engineGet('/api/v1/engine/escalation/forecast');
  return forwardEngineResponse(res);
}
