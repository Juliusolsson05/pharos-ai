/**
 * PHAROS — RSS News Feeds
 * 30 curated feeds from major global news sources + conflict-specific collections.
 */

import type { RssFeed, ConflictCollection, ConflictChannel } from '@/types/domain';

// ─── ALL FEEDS (30) ───────────────────────────────────────────

export const RSS_FEEDS: RssFeed[] = [
  // ── US / Western mainstream ──
  { id: 'reuters',       name: 'Reuters',              url: 'https://news.google.com/rss/search?q=site:reuters.com+when:1d&hl=en-US&gl=US&ceid=US:en', perspective: 'WESTERN', country: 'UK/US', tags: ['world', 'wire'], tier: 1 },
  { id: 'ap',            name: 'Associated Press',     url: 'https://feedx.net/rss/ap.xml',                      perspective: 'WESTERN',     country: 'US',        tags: ['world', 'wire'], tier: 1 },
  { id: 'bbc',           name: 'BBC World',            url: 'https://feeds.bbci.co.uk/news/world/rss.xml',       perspective: 'WESTERN',     country: 'UK',        tags: ['world'], tier: 2 },
  { id: 'nyt',           name: 'New York Times',       url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', perspective: 'WESTERN', country: 'US',        tags: ['world'], tier: 2 },
  { id: 'wapo',          name: 'Washington Post',      url: 'https://feeds.washingtonpost.com/rss/world',              perspective: 'WESTERN', country: 'US', tags: ['world'], tier: 2 },
  { id: 'guardian',      name: 'The Guardian',         url: 'https://www.theguardian.com/world/rss',             perspective: 'WESTERN',     country: 'UK',        tags: ['world'], tier: 2 },
  { id: 'cnn',           name: 'CNN World',            url: 'http://rss.cnn.com/rss/edition_world.rss',          perspective: 'WESTERN',     country: 'US',        tags: ['world'], tier: 2 },
  { id: 'fox',           name: 'Fox News World',       url: 'https://moxie.foxnews.com/google-publisher/world.xml', perspective: 'WESTERN',  country: 'US',        tags: ['world', 'conservative'], tier: 3 },
  { id: 'ft',            name: 'Financial Times',      url: 'https://www.ft.com/world?format=rss',               perspective: 'WESTERN',     country: 'UK',        tags: ['world', 'finance'], tier: 2 },
  { id: 'dw',            name: 'Deutsche Welle',       url: 'https://rss.dw.com/xml/rss-en-world',               perspective: 'WESTERN',     country: 'Germany',   tags: ['world'], tier: 3 },

  // ── US Government / Military ──
  { id: 'dod',           name: 'US Dept of Defense',   url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10', perspective: 'US_GOV', country: 'US', tags: ['military', 'official'], tier: 1 },
  { id: 'centcom',       name: 'CENTCOM News',         url: 'https://news.google.com/rss/search?q=CENTCOM+when:1d&hl=en-US&gl=US&ceid=US:en', perspective: 'US_GOV', country: 'US', tags: ['military', 'official', 'mideast'], tier: 1 },

  // ── Israeli media ──
  { id: 'timesofisrael', name: 'Times of Israel',      url: 'https://www.timesofisrael.com/feed/',               perspective: 'ISRAELI',     country: 'Israel',    tags: ['israel', 'mideast'], tier: 3 },
  { id: 'jpost',         name: 'Jerusalem Post',       url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',  perspective: 'ISRAELI',     country: 'Israel',    tags: ['israel', 'mideast'], tier: 3 },
  { id: 'haaretz',       name: 'Haaretz',              url: 'https://www.haaretz.com/srv/haaretz-latest-headlines',   perspective: 'ISRAELI', country: 'Israel', tags: ['israel', 'mideast', 'liberal'], tier: 3 },
  { id: 'i24',           name: 'i24NEWS',              url: 'https://news.google.com/rss/search?q=site:i24news.tv+when:1d&hl=en-US&gl=US&ceid=US:en', perspective: 'ISRAELI', country: 'Israel', tags: ['israel', 'mideast'], tier: 3 },

  // ── Iranian state / aligned media ──
  { id: 'presstv',       name: 'Press TV',             url: 'https://www.presstv.ir/rss.xml',                         perspective: 'IRANIAN', country: 'Iran', tags: ['iran', 'mideast'], stateFunded: true, tier: 4 },
  { id: 'irna',          name: 'IRNA',                 url: 'https://news.google.com/rss/search?q=site:en.irna.ir+when:1d&hl=en-US&gl=US&ceid=US:en', perspective: 'IRANIAN', country: 'Iran', tags: ['iran', 'mideast', 'official'], stateFunded: true, tier: 4 },
  { id: 'tehrantimes',   name: 'Tehran Times',         url: 'https://news.google.com/rss/search?q=site:tehrantimes.com+when:1d&hl=en-US&gl=US&ceid=US:en', perspective: 'IRANIAN', country: 'Iran', tags: ['iran', 'mideast'], stateFunded: true, tier: 4 },
  { id: 'tasnim',        name: 'Tasnim News',          url: 'https://news.google.com/rss/search?q=site:tasnimnews.com+when:1d&hl=en-US&gl=US&ceid=US:en', perspective: 'IRANIAN', country: 'Iran', tags: ['iran', 'mideast', 'irgc'], tier: 4 },

  // ── Arab / Middle East ──
  { id: 'aljazeera',     name: 'Al Jazeera',           url: 'https://www.aljazeera.com/xml/rss/all.xml',         perspective: 'ARAB',        country: 'Qatar',     tags: ['world', 'mideast'], stateFunded: true, tier: 2 },
  { id: 'alarabiya',     name: 'Al Arabiya',           url: 'https://news.google.com/rss/search?q=site:english.alarabiya.net+when:1d&hl=en-US&gl=US&ceid=US:en', perspective: 'ARAB', country: 'Saudi Arabia', tags: ['mideast'], stateFunded: true, tier: 3 },
  { id: 'middleeasteye', name: 'Middle East Eye',      url: 'https://www.middleeasteye.net/rss',                 perspective: 'ARAB',        country: 'UK',        tags: ['mideast'], tier: 3 },

  // ── Russian ──
  { id: 'rt',            name: 'RT (Russia Today)',    url: 'https://www.rt.com/rss/news/',                      perspective: 'RUSSIAN',     country: 'Russia',    tags: ['world'], stateFunded: true, tier: 4 },
  { id: 'tass',          name: 'TASS',                 url: 'https://tass.com/rss/v2.xml',                       perspective: 'RUSSIAN',     country: 'Russia',    tags: ['world', 'official'], stateFunded: true, tier: 4 },

  // ── Chinese ──
  { id: 'xinhua',        name: 'Xinhua',               url: 'https://www.xinhuanet.com/english/rss/worldrss.xml', perspective: 'CHINESE',    country: 'China',     tags: ['world'], stateFunded: true, tier: 4 },
  { id: 'scmp',          name: 'South China Morning Post', url: 'https://www.scmp.com/rss/91/feed',              perspective: 'CHINESE',     country: 'Hong Kong', tags: ['world', 'asia'], tier: 3 },

  // ── Independent / analysis ──
  { id: 'theintercept',  name: 'The Intercept',        url: 'https://theintercept.com/feed/?rss',                perspective: 'INDEPENDENT', country: 'US',        tags: ['investigative'], tier: 3 },
  { id: 'foreignpolicy', name: 'Foreign Policy',       url: 'https://foreignpolicy.com/feed/',                   perspective: 'INDEPENDENT', country: 'US',        tags: ['analysis', 'geopolitics'], tier: 3 },
  { id: 'warzone',       name: 'The War Zone',         url: 'https://www.twz.com/feed',                          perspective: 'INDEPENDENT', country: 'US',        tags: ['military', 'defense'], tier: 3 },
];

// ─── CONFLICT COLLECTIONS ─────────────────────────────────────

export const CONFLICT_COLLECTIONS: ConflictCollection[] = [
  {
    id: 'iran-israel-us',
    name: 'IRAN–ISRAEL–US CONFLICT',
    description: 'Operation Epic Fury / Operation Roaring Lion — Multi-perspective monitoring of the Iran-Israel-US military confrontation.',
    channels: [
      {
        label: 'WESTERN WIRE',
        description: 'Reuters, AP, BBC — closest to neutral, fact-first wire reporting',
        perspective: 'Western / Wire Services',
        feedIds: ['reuters', 'ap', 'bbc'],
        color: '#3b82f6',
      },
      {
        label: 'US / PENTAGON',
        description: 'Official US military & government sources — CENTCOM, DoD',
        perspective: 'US Government / Military',
        feedIds: ['centcom', 'dod', 'fox', 'cnn'],
        color: '#60a5fa',
      },
      {
        label: 'ISRAELI MEDIA',
        description: 'Times of Israel, Jerusalem Post, Haaretz, i24 — Israeli domestic reporting',
        perspective: 'Israeli',
        feedIds: ['timesofisrael', 'jpost', 'haaretz', 'i24'],
        color: '#a78bfa',
      },
      {
        label: 'IRANIAN STATE',
        description: 'Press TV, IRNA, Tehran Times, Tasnim — Iranian government narrative',
        perspective: 'Iranian State Media',
        feedIds: ['presstv', 'irna', 'tehrantimes', 'tasnim'],
        color: '#ef4444',
      },
    ],
  },
];

// Helper: get feed by id
export function getFeedById(id: string): RssFeed | undefined {
  return RSS_FEEDS.find(f => f.id === id);
}

// Helper: get feeds for a channel
export function getFeedsForChannel(feedIds: string[]): RssFeed[] {
  return feedIds.map(id => RSS_FEEDS.find(f => f.id === id)).filter(Boolean) as RssFeed[];
}
