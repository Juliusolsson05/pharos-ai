import { type NextRequest } from 'next/server';
import { engineGet, forwardEngineResponse } from '@/server/lib/engine-proxy';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const qs = params.toString();
  const res = await engineGet(`/api/v1/engine/geo/near${qs ? `?${qs}` : ''}`);
  return forwardEngineResponse(res);
}
