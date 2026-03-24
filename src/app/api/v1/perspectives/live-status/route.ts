import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';

import { PERSPECTIVE_CHANNELS } from '@/data/perspective-channels';

const CACHE_TTL = 600;
const IS_LIVE_RE = /"isLive"\s*:\s*true/;
const PAGE_VIDEO_ID_RE = /"videoId"\s*:\s*"([^"]+)"/;
const CANONICAL_VIDEO_RE = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)"/;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? '';
const VIDEO_ID_RE = /<yt:videoId>([^<]+)<\/yt:videoId>/g;

type CacheEntry = {
  isLive: boolean;
  videoId: string | null;
  checkedAt: number;
};

const cache = new Map<string, CacheEntry>();

function resolveChannelId(handle: string): string | null {
  const ch = PERSPECTIVE_CHANNELS.find(c => c.handle.toLowerCase() === handle.toLowerCase());
  return ch?.channelId ?? null;
}

function extractVideoId(html: string): string | null {
  return html.match(CANONICAL_VIDEO_RE)?.[1]
    ?? html.match(PAGE_VIDEO_ID_RE)?.[1]
    ?? null;
}

async function fetchRecentVideoIds(channelId: string, limit = 5): Promise<string[]> {
  const res = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    { signal: AbortSignal.timeout(8000) },
  );
  const xml = await res.text();
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = VIDEO_ID_RE.exec(xml)) !== null && ids.length < limit) {
    ids.push(match[1]);
  }
  VIDEO_ID_RE.lastIndex = 0;
  return ids;
}

async function findLiveVideo(videoIds: string[]): Promise<{ videoId: string } | null> {
  if (!YOUTUBE_API_KEY || videoIds.length === 0) return null;

  const ids = videoIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${ids}&part=snippet,liveStreamingDetails&fields=items(id,snippet/liveBroadcastContent)&key=${YOUTUBE_API_KEY}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    items?: { id: string; snippet?: { liveBroadcastContent?: string } }[];
  };

  for (const item of data.items ?? []) {
    if (item.snippet?.liveBroadcastContent === 'live') {
      return { videoId: item.id };
    }
  }

  return null;
}

async function checkLiveStatusViaPage(handle: string): Promise<{ isLive: boolean; videoId: string | null }> {
  const res = await fetch(`https://www.youtube.com/${handle}/live`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      Cookie: 'CONSENT=YES+1',
    },
    signal: AbortSignal.timeout(8000),
  });
  const html = await res.text();
  const isLive = IS_LIVE_RE.test(html);

  return {
    isLive,
    videoId: isLive ? extractVideoId(html) : null,
  };
}

async function checkLiveStatus(handle: string): Promise<{ isLive: boolean; videoId: string | null }> {
  const cached = cache.get(handle);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL * 1000) {
    return { isLive: cached.isLive, videoId: cached.videoId };
  }

  const offline = { isLive: false, videoId: null };

  try {
    if (!YOUTUBE_API_KEY) {
      const fallback = await checkLiveStatusViaPage(handle);
      cache.set(handle, { ...fallback, checkedAt: Date.now() });
      return fallback;
    }

    const channelId = resolveChannelId(handle);
    if (!channelId) {
      const fallback = await checkLiveStatusViaPage(handle);
      cache.set(handle, { ...fallback, checkedAt: Date.now() });
      return fallback;
    }

    const videoIds = await fetchRecentVideoIds(channelId);
    if (videoIds.length === 0) {
      const fallback = await checkLiveStatusViaPage(handle);
      cache.set(handle, { ...fallback, checkedAt: Date.now() });
      return fallback;
    }

    const live = await findLiveVideo(videoIds);
    const result = live
      ? { isLive: true, videoId: live.videoId }
      : await checkLiveStatusViaPage(handle);

    cache.set(handle, { ...result, checkedAt: Date.now() });
    return result;
  } catch {
    cache.set(handle, { ...offline, checkedAt: Date.now() });
    return offline;
  }
}

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle');
  if (!handle || !handle.startsWith('@')) {
    return err('INVALID_PARAMS', 'handle query param required (e.g. ?handle=@SkyNews)');
  }

  const { isLive, videoId } = await checkLiveStatus(handle);

  return ok(
    { handle, isLive, playableInEmbed: isLive, videoId, ttl: CACHE_TTL },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL}`,
      },
    },
  );
}
