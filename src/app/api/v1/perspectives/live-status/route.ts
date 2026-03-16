import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';

const CACHE_TTL = 600;
const IS_LIVE_RE = /"isLive"\s*:\s*true/;
const VIDEO_ID_RE = /"videoId"\s*:\s*"([^"]+)"/;
const CANONICAL_VIDEO_RE = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)"/;

type CacheEntry = {
  isLive: boolean;
  videoId: string | null;
  checkedAt: number;
};

const cache = new Map<string, CacheEntry>();

function extractVideoId(html: string): string | null {
  return html.match(CANONICAL_VIDEO_RE)?.[1]
    ?? html.match(VIDEO_ID_RE)?.[1]
    ?? null;
}

async function checkLiveStatus(handle: string): Promise<{ isLive: boolean; videoId: string | null }> {
  const cached = cache.get(handle);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL * 1000) {
    return { isLive: cached.isLive, videoId: cached.videoId };
  }

  try {
    const res = await fetch(`https://www.youtube.com/${handle}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'CONSENT=YES+1',
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const isLive = IS_LIVE_RE.test(html);
    const videoId = isLive ? extractVideoId(html) : null;

    cache.set(handle, { isLive, videoId, checkedAt: Date.now() });
    return { isLive, videoId };
  } catch {
    cache.set(handle, { isLive: false, videoId: null, checkedAt: Date.now() });
    return { isLive: false, videoId: null };
  }
}

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle');
  if (!handle || !handle.startsWith('@')) {
    return err('INVALID_PARAMS', 'handle query param required (e.g. ?handle=@SkyNews)');
  }

  const { isLive, videoId } = await checkLiveStatus(handle);

  // Always allow embedding if the channel is live — worst case YouTube shows
  // its own error inside the iframe for the ~1 in 30 non-embeddable channels
  return ok(
    { handle, isLive, playableInEmbed: isLive, videoId, ttl: CACHE_TTL },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL}`,
      },
    },
  );
}
