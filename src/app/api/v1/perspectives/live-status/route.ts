import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';

const CACHE_TTL = 600;
const CANONICAL_VIDEO_RE = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)"/;
const IS_LIVE_RE = /"isLive"\s*:\s*true/;
const PLAYABLE_VIDEO_RE = /"playabilityStatus":\{"status":"OK","playableInEmbed":(true|false)[\s\S]{0,4000}?"videoId":"([^"]+)"/;

type CacheEntry = {
  isLive: boolean;
  playableInEmbed: boolean;
  videoId: string | null;
  checkedAt: number;
};

const cache = new Map<string, CacheEntry>();

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseLivePlayback(html: string) {
  const canonicalVideoId = html.match(CANONICAL_VIDEO_RE)?.[1] ?? null;

  if (canonicalVideoId) {
    const canonicalPlayable = new RegExp(
      `"playabilityStatus":\\{"status":"OK","playableInEmbed":(true|false)[\\s\\S]{0,4000}?"videoId":"${escapeRegExp(canonicalVideoId)}"`,
    ).exec(html);

    if (canonicalPlayable) {
      return {
        playableInEmbed: canonicalPlayable[1] === 'true',
        videoId: canonicalPlayable[1] === 'true' ? canonicalVideoId : null,
      };
    }

    return {
      playableInEmbed: true,
      videoId: canonicalVideoId,
    };
  }

  const playableMatch = html.match(PLAYABLE_VIDEO_RE);
  if (!playableMatch) {
    return {
      playableInEmbed: false,
      videoId: null,
    };
  }

  return {
    playableInEmbed: playableMatch[1] === 'true',
    videoId: playableMatch[1] === 'true' ? playableMatch[2] : null,
  };
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
    const playback = isLive
      ? parseLivePlayback(html)
      : { playableInEmbed: false, videoId: null };
    const playableInEmbed = playback.playableInEmbed;
    const videoId = playback.videoId;

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
