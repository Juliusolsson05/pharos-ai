import { NextRequest, NextResponse } from 'next/server';

type CacheEntry = { buffer: ArrayBuffer; contentType: string; ts: number };
const cache = new Map<string, CacheEntry>();
const TTL = 60 * 60 * 1000;
const MAX_CACHE = 500;
const FETCH_TIMEOUT = 8000;
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB

function evict() {
  if (cache.size <= MAX_CACHE) return;
  const entries = Array.from(cache.entries()).sort((a, b) => a[1].ts - b[1].ts);
  while (cache.size > MAX_CACHE * 0.7) {
    const oldest = entries.shift();
    if (oldest) cache.delete(oldest[0]);
  }
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.ts > TTL) cache.delete(key);
  }
}

/** Block private / link-local / loopback IPs to prevent SSRF. */
function isPrivateHost(hostname: string): boolean {
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) return true;
  if (hostname === '::1' || hostname.startsWith('fe80:') || hostname.startsWith('fc00:')) return true;
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') return true;
  if (hostname === 'localhost' || hostname === '0.0.0.0') return true;
  return false;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing ?url=', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return new NextResponse('Invalid protocol', { status: 400 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  if (isPrivateHost(parsed.hostname)) {
    return new NextResponse('Blocked host', { status: 403 });
  }

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) {
    return new NextResponse(cached.buffer, {
      headers: { 'Content-Type': cached.contentType, 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200', 'X-Cache': 'HIT' },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: parsed.origin + '/',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return new NextResponse(`Upstream ${res.status}`, { status: 502 });

    const contentLength = Number(res.headers.get('content-length') ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      return new NextResponse('Response too large', { status: 413 });
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await res.arrayBuffer();

    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      return new NextResponse('Response too large', { status: 413 });
    }

    cache.set(url, { buffer, contentType, ts: Date.now() });
    evict();

    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200', 'X-Cache': 'MISS' },
    });
  } catch (fetchErr) {
    return new NextResponse(fetchErr instanceof Error ? fetchErr.message : 'fetch failed', { status: 502 });
  }
}
