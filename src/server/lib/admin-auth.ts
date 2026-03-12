import { timingSafeEqual } from 'crypto';

import { NextRequest } from 'next/server';

import { err } from './api-utils';

/**
 * Guard function for admin routes. Call at the top of every handler:
 *   const denied = requireAdmin(req);
 *   if (denied) return denied;
 */
export function requireAdmin(req: NextRequest) {
  const header = req.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return err('UNAUTHORIZED', 'Missing or malformed Authorization header', 401);
  }
  const token = header.slice(7);
  const expected = process.env.PHAROS_ADMIN_API_KEY;
  if (!expected) {
    return err('SERVER_ERROR', 'Admin API key not configured', 500);
  }
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
    return err('FORBIDDEN', 'Invalid API key', 403);
  }
  return null; // access granted
}
