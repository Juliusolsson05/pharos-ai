import { enginePost, forwardEngineResponse } from '@/server/lib/engine-proxy';

export async function POST() {
  const res = await enginePost('/api/v1/engine/sitrep/generate');
  return forwardEngineResponse(res);
}
