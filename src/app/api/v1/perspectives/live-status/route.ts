import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';

import { PERSPECTIVE_CHANNELS } from '@/data/perspective-channels';

const CACHE_TTL = 600;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? '';
const VIDEO_ID_RE = /<yt:videoId>([^<]+)<\/yt:videoId>/g;

type CacheEntry = {
  isLive: boolean;
  videoId: string | null;
  checkedAt: number;
};

const cache = new Map<string, CacheEntry>();

/** Resolve a @handle to a YouTube channel ID using the static channel list. */
function resolveChannelId(handle: string): string | null {
  const ch = PERSPECTIVE_CHANNELS.find(c => c.handle.toLowerCase() === handle.toLowerCase());
  return ch?.channelId ?? null;
}

/** Fetch the latest video IDs for a channel from YouTube's public RSS feed. */
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

/** Check which videos are live using the YouTube Data API v3. */
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

async function checkLiveStatus(handle: string): Promise<{ isLive: boolean; videoId: string | null }> {
  const cached = cache.get(handle);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL * 1000) {
    return { isLive: cached.isLive, videoId: cached.videoId };
  }

  const offline = { isLive: false, videoId: null };

  try {
    const channelId = resolveChannelId(handle);
    if (!channelId) {
      cache.set(handle, { ...offline, checkedAt: Date.now() });
      return offline;
    }

    const videoIds = await fetchRecentVideoIds(channelId);
    if (videoIds.length === 0) {
      cache.set(handle, { ...offline, checkedAt: Date.now() });
      return offline;
    }

    const live = await findLiveVideo(videoIds);
    const result = live
      ? { isLive: true, videoId: live.videoId }
      : offline;

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
