import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';

const CACHE_TTL = 600;
const IS_LIVE_RE = /"isLive"\s*:\s*true/;
const VIDEO_ID_RE = /"videoId"\s*:\s*"([^"]+)"/;

type CacheEntry = {
  isLive: boolean;
  playableInEmbed: boolean;
  videoId: string | null;
  checkedAt: number;
};

const cache = new Map<string, CacheEntry>();

function isPlayableInEmbed(html: string): boolean {
  const match = html.match(/"playableInEmbed"\s*:\s*(true|false)/);
  return match?.[1] === 'true';
}

async function checkLiveStatus(handle: string): Promise<{ isLive: boolean; playableInEmbed: boolean; videoId: string | null }> {
  const cached = cache.get(handle);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL * 1000) {
    return {
      isLive: cached.isLive,
      playableInEmbed: cached.playableInEmbed,
      videoId: cached.videoId,
    };
  }

  try {
    const res = await fetch(`https://www.youtube.com/${handle}/live`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const isLive = IS_LIVE_RE.test(html);
    const playableInEmbed = isLive && isPlayableInEmbed(html);
    const videoMatch = VIDEO_ID_RE.exec(html);
    const videoId = isLive && playableInEmbed && videoMatch ? videoMatch[1] : null;

    cache.set(handle, { isLive, playableInEmbed, videoId, checkedAt: Date.now() });
    return { isLive, playableInEmbed, videoId };
  } catch {
    cache.set(handle, { isLive: false, playableInEmbed: false, videoId: null, checkedAt: Date.now() });
    return { isLive: false, playableInEmbed: false, videoId: null };
  }
}

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle');
  if (!handle || !handle.startsWith('@')) {
    return err('INVALID_PARAMS', 'handle query param required (e.g. ?handle=@SkyNews)');
  }

  const { isLive, playableInEmbed, videoId } = await checkLiveStatus(handle);

  return ok(
    { handle, isLive, playableInEmbed, videoId, ttl: CACHE_TTL },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL}`,
      },
    },
  );
}
