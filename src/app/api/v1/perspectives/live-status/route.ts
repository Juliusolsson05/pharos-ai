import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';

const CACHE_TTL = 600;
const CANONICAL_VIDEO_RE = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)"/;
const IS_LIVE_RE = /"isLive"\s*:\s*true/;

type CacheEntry = {
  isLive: boolean;
  playableInEmbed: boolean;
  videoId: string | null;
  checkedAt: number;
};

const cache = new Map<string, CacheEntry>();

async function isEmbeddableVideo(videoId: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });

    return res.ok;
  } catch {
    return false;
  }
}

async function parseLivePlayback(html: string) {
  const canonicalVideoId = html.match(CANONICAL_VIDEO_RE)?.[1] ?? null;

  if (!canonicalVideoId) {
    return {
      playableInEmbed: false,
      videoId: null,
    };
  }

  const playableInEmbed = await isEmbeddableVideo(canonicalVideoId);

  return {
    playableInEmbed,
    videoId: playableInEmbed ? canonicalVideoId : null,
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
      ? await parseLivePlayback(html)
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
