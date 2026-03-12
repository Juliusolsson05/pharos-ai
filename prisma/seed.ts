/**
 * prisma/seed.ts
 * Populates the database from existing static data files.
 * Run: npx prisma db seed
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { CONFLICT } from './seed-data/iran-conflict.js';
import { ACTORS } from './seed-data/iran-actors.js';
import { EVENTS } from './seed-data/iran-events.js';
import { X_POSTS } from './seed-data/iran-x-posts.js';
import {
  STRIKE_ARCS,
  MISSILE_TRACKS,
  TARGETS,
  ALLIED_ASSETS,
  THREAT_ZONES,
  HEAT_POINTS,
} from './seed-data/map-data.js';
import { MAP_STORIES } from './seed-data/map-stories.js';
import { RSS_FEEDS, CONFLICT_COLLECTIONS } from './seed-data/rss-feeds.js';
import { ECONOMIC_INDEXES } from './seed-data/economic-indexes.js';
import { MARKET_GROUPS } from './seed-data/prediction-groups.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Map domain.ts enum values to Prisma enum values
function mapActorType(type: string): 'STATE' | 'NON_STATE' | 'ORGANIZATION' | 'INDIVIDUAL' {
  if (type === 'NON-STATE') return 'NON_STATE';
  return type as 'STATE' | 'ORGANIZATION' | 'INDIVIDUAL';
}

async function main() {
  console.log('Seeding database...\n');

  // Clear existing data (idempotent re-seed)
  console.log('0. Clearing existing data...');
  await prisma.conflict.deleteMany();
  await prisma.rssFeed.deleteMany();
  await prisma.economicIndex.deleteMany();
  await prisma.predictionGroup.deleteMany();
  console.log('   ✓ Cleared\n');

  // ─── 1. Conflict ────────────────────────────────────────────────────────────
  console.log('1. Conflict...');
  const conflict = await prisma.conflict.upsert({
    where: { id: CONFLICT.id },
    update: {},
    create: {
      id: CONFLICT.id,
      name: CONFLICT.name,
      codename: CONFLICT.codename,
        status: CONFLICT.status,
        threatLevel: CONFLICT.threatLevel,
        startDate: new Date(CONFLICT.startDate),
        region: CONFLICT.region,
        timezone: CONFLICT.timezone,
        escalation: CONFLICT.escalation,
        summary: CONFLICT.summary,
        keyFacts: CONFLICT.keyFacts,
      objectives: CONFLICT.objectives,
      commanders: CONFLICT.commanders,
    },
  });
  console.log(`   ✓ Conflict: ${conflict.id}`);

  // ─── 2. Conflict Day Snapshots + Casualties + Chips + Scenarios ─────────────
  console.log('2. Day snapshots...');
  for (const snap of CONFLICT.daySnapshots) {
    const snapshot = await prisma.conflictDaySnapshot.create({
      data: {
        conflictId: CONFLICT.id,
        day: new Date(snap.day + 'T00:00:00Z'),
        dayLabel: snap.dayLabel,
        summary: snap.summary,
        keyFacts: snap.keyFacts,
        escalation: snap.escalation,
        economicNarrative: snap.economicImpact.narrative,
      },
    });

    // Casualties — flatten the nested object
    const cas = snap.casualties;
    const casualtyRows: { faction: string; killed: number; wounded: number; civilians: number; injured: number }[] = [
      { faction: 'us', killed: cas.us.kia, wounded: cas.us.wounded, civilians: cas.us.civilians, injured: 0 },
      { faction: 'israel', killed: cas.israel.kia, wounded: cas.israel.wounded, civilians: cas.israel.civilians, injured: cas.israel.injured },
      { faction: 'iran', killed: cas.iran.killed, wounded: 0, civilians: 0, injured: cas.iran.injured },
      { faction: 'lebanon', killed: cas.lebanon.killed, wounded: 0, civilians: 0, injured: cas.lebanon.injured },
    ];
    for (const [key, val] of Object.entries(cas.regional)) {
      casualtyRows.push({ faction: key, killed: val.killed, wounded: 0, civilians: 0, injured: val.injured });
    }
    await prisma.casualtySummary.createMany({
      data: casualtyRows.map(r => ({ snapshotId: snapshot.id, ...r })),
    });

    // Economic impact chips
    await prisma.economicImpactChip.createMany({
      data: snap.economicImpact.chips.map((chip, i) => ({
        snapshotId: snapshot.id,
        ord: i,
        label: chip.label,
        val: chip.val,
        sub: chip.sub,
        color: chip.color,
      })),
    });

    // Scenarios
    await prisma.scenario.createMany({
      data: snap.scenarios.map((s, i) => ({
        snapshotId: snapshot.id,
        ord: i,
        label: s.label,
        subtitle: s.subtitle,
        color: s.color,
        prob: s.prob,
        body: s.body,
      })),
    });

    console.log(`   ✓ ${snap.dayLabel} — ${casualtyRows.length} factions, ${snap.economicImpact.chips.length} chips, ${snap.scenarios.length} scenarios`);
  }

  // ─── 3. Actors + Day Snapshots + Actions ────────────────────────────────────
  console.log('3. Actors...');

  // Display metadata keyed by actor ID
  const ACTOR_DISPLAY: Record<string, {
    mapKey: string | null; cssVar: string | null; colorRgb: number[];
    affiliation: 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL'; mapGroup: string;
  }> = {
    us:      { mapKey: 'US',     cssVar: 'var(--blue)',    colorRgb: [45,114,210],  affiliation: 'FRIENDLY', mapGroup: 'Coalition' },
    idf:     { mapKey: 'ISRAEL', cssVar: 'var(--teal)',    colorRgb: [50,200,200],  affiliation: 'FRIENDLY', mapGroup: 'Coalition' },
    iran:    { mapKey: 'IRAN',   cssVar: 'var(--danger)',  colorRgb: [231,106,110], affiliation: 'HOSTILE',  mapGroup: 'Adversary' },
    irgc:    { mapKey: 'IRGC',   cssVar: 'var(--danger)',  colorRgb: [200,50,50],   affiliation: 'HOSTILE',  mapGroup: 'Adversary' },
    houthis: { mapKey: 'HOUTHI', cssVar: 'var(--warning)', colorRgb: [236,154,60],  affiliation: 'HOSTILE',  mapGroup: 'Adversary' },
    russia:  { mapKey: null,     cssVar: null,             colorRgb: [],            affiliation: 'NEUTRAL',  mapGroup: 'Observer'  },
  };

  for (const actor of ACTORS) {
    const display = ACTOR_DISPLAY[actor.id];
    await prisma.actor.create({
      data: {
        id: actor.id,
        conflictId: CONFLICT.id,
        name: actor.name,
        fullName: actor.fullName,
        countryCode: actor.countryCode ?? null,
        type: mapActorType(actor.type),
        ...(display ? {
          mapKey:      display.mapKey,
          cssVar:      display.cssVar,
          colorRgb:    display.colorRgb,
          affiliation: display.affiliation,
          mapGroup:    display.mapGroup,
        } : {}),
        activityLevel: actor.activityLevel,
        activityScore: actor.activityScore,
        stance: actor.stance,
        saying: actor.saying,
        doing: actor.doing,
        assessment: actor.assessment,
        keyFigures: actor.keyFigures,
        linkedEventIds: actor.linkedEventIds,
      },
    });

    // Day snapshots
    for (const [day, snap] of Object.entries(actor.daySnapshots)) {
      await prisma.actorDaySnapshot.create({
        data: {
          actorId: actor.id,
          day: new Date(day + 'T00:00:00Z'),
          activityLevel: snap.activityLevel,
          activityScore: snap.activityScore,
          stance: snap.stance,
          saying: snap.saying,
          doing: snap.doing,
          assessment: snap.assessment,
        },
      });
    }

    // Recent actions
    for (const action of actor.recentActions) {
      await prisma.actorAction.create({
        data: {
          actorId: actor.id,
          date: action.date,
          type: action.type,
          description: action.description,
          verified: action.verified,
          significance: action.significance,
        },
      });
    }

    console.log(`   ✓ ${actor.name} — ${Object.keys(actor.daySnapshots).length} snapshots, ${actor.recentActions.length} actions`);
  }

  // Create map-only actors (no intelligence data, just display metadata)
  const NEW_ACTORS: {
    id: string; name: string; fullName: string; type: 'STATE' | 'NON_STATE' | 'ORGANIZATION';
    mapKey: string; cssVar: string; colorRgb: number[];
    affiliation: 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL'; mapGroup: string;
  }[] = [
    { id: 'nato',      name: 'NATO',       fullName: 'North Atlantic Treaty Organization', type: 'ORGANIZATION', mapKey: 'NATO',      cssVar: 'var(--cyber)',   colorRgb: [160,100,220], affiliation: 'FRIENDLY', mapGroup: 'Coalition' },
    { id: 'usil',      name: 'US-IL Joint', fullName: 'US-Israel Joint Operations',        type: 'ORGANIZATION', mapKey: 'USIL',      cssVar: 'var(--blue)',    colorRgb: [45,114,210],  affiliation: 'FRIENDLY', mapGroup: 'Coalition' },
    { id: 'hezbollah', name: 'Hezbollah',   fullName: 'Hezbollah',                         type: 'NON_STATE',    mapKey: 'HEZBOLLAH', cssVar: 'var(--danger)',  colorRgb: [180,40,40],   affiliation: 'HOSTILE',  mapGroup: 'Adversary' },
    { id: 'pmf',       name: 'Iraqi PMF',   fullName: 'Popular Mobilization Forces',       type: 'NON_STATE',    mapKey: 'PMF',       cssVar: 'var(--warning)', colorRgb: [200,120,40],  affiliation: 'HOSTILE',  mapGroup: 'Adversary' },
  ];

  for (const a of NEW_ACTORS) {
    await prisma.actor.create({
      data: {
        id: a.id,
        conflictId: CONFLICT.id,
        name: a.name,
        fullName: a.fullName,
        type: a.type,
        mapKey: a.mapKey,
        cssVar: a.cssVar,
        colorRgb: a.colorRgb,
        affiliation: a.affiliation,
        mapGroup: a.mapGroup,
        activityLevel: 'MODERATE',
        activityScore: 0,
        stance: 'NEUTRAL',
        saying: '',
        doing: [],
        assessment: '',
        keyFigures: [],
        linkedEventIds: [],
      },
    });
    console.log(`   ✓ ${a.name} (new map actor)`);
  }

  // ─── 4. Events + Sources + Actor Responses ──────────────────────────────────
  console.log('4. Events...');
  for (const event of EVENTS) {
    await prisma.intelEvent.create({
      data: {
        id: event.id,
        conflictId: CONFLICT.id,
        timestamp: new Date(event.timestamp),
        severity: event.severity,
        type: event.type,
        title: event.title,
        location: event.location,
        summary: event.summary,
        fullContent: event.fullContent,
        verified: event.verified,
        tags: event.tags,
      },
    });

    if (event.sources.length > 0) {
      await prisma.eventSource.createMany({
        data: event.sources.map(s => ({
          eventId: event.id,
          name: s.name,
          tier: s.tier,
          reliability: s.reliability,
          url: s.url ?? null,
        })),
      });
    }

    // Only create actor responses for actors that exist in our DB
    const validActorIds = new Set(ACTORS.map(a => a.id));
    const validResponses = event.actorResponses.filter(r => validActorIds.has(r.actorId));
    if (validResponses.length > 0) {
      await prisma.eventActorResponse.createMany({
        data: validResponses.map(r => ({
          eventId: event.id,
          actorId: r.actorId,
          actorName: r.actorName,
          stance: r.stance as 'SUPPORTING' | 'OPPOSING' | 'NEUTRAL' | 'UNKNOWN',
          type: r.type,
          statement: r.statement,
        })),
      });
    }
  }
  console.log(`   ✓ ${EVENTS.length} events`);

  // ─── 5. X Posts ─────────────────────────────────────────────────────────────
  console.log('5. X Posts...');
  const validEventIds = new Set(EVENTS.map(e => e.id));
  const validActorIdsSet = new Set(ACTORS.map(a => a.id));

  for (const post of X_POSTS) {
    await prisma.xPost.create({
      data: {
        id: post.id,
        conflictId: CONFLICT.id,
        handle: post.handle,
        displayName: post.displayName,
        avatar: post.avatar,
        avatarColor: post.avatarColor,
        verified: post.verified,
        accountType: post.accountType,
        significance: post.significance,
        timestamp: new Date(post.timestamp),
        content: post.content,
        images: post.images ?? [],
        videoThumb: post.videoThumb ?? null,
        likes: post.likes,
        retweets: post.retweets,
        replies: post.replies,
        views: post.views,
        pharosNote: post.pharosNote ?? null,
        eventId: post.eventId && validEventIds.has(post.eventId) ? post.eventId : null,
        actorId: post.actorId && validActorIdsSet.has(post.actorId) ? post.actorId : null,
      },
    });
  }
  console.log(`   ✓ ${X_POSTS.length} x-posts`);

  // ─── 6. Map Features ────────────────────────────────────────────────────────
  console.log('6. Map features...');
  let mapCount = 0;

  for (const s of STRIKE_ARCS) {
    await prisma.mapFeature.create({
      data: {
        id: s.id, conflictId: CONFLICT.id, featureType: 'STRIKE_ARC',
        actor: s.actor, priority: s.priority, category: s.category, type: s.type, status: s.status,
        timestamp: new Date(s.timestamp),
        geometry: { from: s.from, to: s.to },
        properties: { label: s.label, severity: s.severity },
      },
    });
    mapCount++;
  }

  for (const m of MISSILE_TRACKS) {
    await prisma.mapFeature.create({
      data: {
        id: m.id, conflictId: CONFLICT.id, featureType: 'MISSILE_TRACK',
        actor: m.actor, priority: m.priority, category: m.category, type: m.type, status: m.status,
        timestamp: new Date(m.timestamp),
        geometry: { from: m.from, to: m.to },
        properties: { label: m.label, severity: m.severity },
      },
    });
    mapCount++;
  }

  for (const t of TARGETS) {
    await prisma.mapFeature.create({
      data: {
        id: t.id, conflictId: CONFLICT.id, featureType: 'TARGET',
        actor: t.actor, priority: t.priority, category: t.category, type: t.type, status: t.status,
        timestamp: new Date(t.timestamp),
        geometry: { position: t.position },
        properties: { name: t.name, description: t.description },
      },
    });
    mapCount++;
  }

  for (const a of ALLIED_ASSETS) {
    await prisma.mapFeature.create({
      data: {
        id: a.id, conflictId: CONFLICT.id, featureType: 'ASSET',
        actor: a.actor, priority: a.priority, category: a.category, type: a.type, status: a.status,
        timestamp: null,
        geometry: { position: a.position },
        properties: { name: a.name, description: a.description ?? '' },
      },
    });
    mapCount++;
  }

  for (const z of THREAT_ZONES) {
    await prisma.mapFeature.create({
      data: {
        id: z.id, conflictId: CONFLICT.id, featureType: 'THREAT_ZONE',
        actor: z.actor, priority: z.priority, category: z.category, type: z.type, status: null,
        timestamp: null,
        geometry: { coordinates: z.coordinates },
        properties: { name: z.name, color: z.color },
      },
    });
    mapCount++;
  }

  for (let i = 0; i < HEAT_POINTS.length; i++) {
    const h = HEAT_POINTS[i];
    await prisma.mapFeature.create({
      data: {
        id: `hp-${i + 1}`, conflictId: CONFLICT.id, featureType: 'HEAT_POINT',
        actor: 'US', priority: 'P2', category: 'HEATMAP', type: 'HEAT_POINT', status: null,
        timestamp: null,
        geometry: { position: h.position },
        properties: { weight: h.weight },
      },
    });
    mapCount++;
  }
  console.log(`   ✓ ${mapCount} map features`);

  // ─── 7. Map Stories ─────────────────────────────────────────────────────────
  console.log('7. Map stories...');
  for (const story of MAP_STORIES) {
    await prisma.mapStory.create({
      data: {
        id: story.id,
        conflictId: CONFLICT.id,
        primaryEventId: null,
        sourceEventIds: [],
        title: story.title,
        tagline: story.tagline,
        iconName: story.iconName,
        category: story.category as 'STRIKE' | 'RETALIATION' | 'NAVAL' | 'INTEL' | 'DIPLOMATIC',
        narrative: story.narrative,
        highlightStrikeIds: story.highlightStrikeIds,
        highlightMissileIds: story.highlightMissileIds,
        highlightTargetIds: story.highlightTargetIds,
        highlightAssetIds: story.highlightAssetIds,
        viewState: story.viewState,
        keyFacts: story.keyFacts,
        timestamp: new Date(story.timestamp),
        events: {
          create: story.events.map((e, i) => ({
            ord: i,
            time: e.time,
            label: e.label,
            type: e.type as 'STRIKE' | 'RETALIATION' | 'INTEL' | 'NAVAL' | 'POLITICAL',
          })),
        },
      },
    });
  }
  console.log(`   ✓ ${MAP_STORIES.length} stories`);

  // ─── 8. RSS Feeds ───────────────────────────────────────────────────────────
  console.log('8. RSS feeds...');
  await prisma.rssFeed.createMany({
    data: RSS_FEEDS.map(f => ({
      id: f.id,
      name: f.name,
      url: f.url,
      perspective: f.perspective as 'WESTERN' | 'US_GOV' | 'ISRAELI' | 'IRANIAN' | 'ARAB' | 'RUSSIAN' | 'CHINESE' | 'INDEPENDENT' | 'INTL_ORG',
      country: f.country,
      tags: f.tags,
      stateFunded: f.stateFunded ?? false,
      tier: f.tier,
    })),
  });
  console.log(`   ✓ ${RSS_FEEDS.length} feeds`);

  // ─── 9. Conflict Collections + Channels + ChannelFeeds ──────────────────────
  console.log('9. Conflict collections...');
  for (const coll of CONFLICT_COLLECTIONS) {
    const collection = await prisma.conflictCollection.create({
      data: {
        conflictId: CONFLICT.id,
        name: coll.name,
        description: coll.description,
      },
    });

    for (let i = 0; i < coll.channels.length; i++) {
      const ch = coll.channels[i];
      const channel = await prisma.conflictChannel.create({
        data: {
          collectionId: collection.id,
          label: ch.label,
          description: ch.description,
          perspective: ch.perspective,
          color: ch.color,
          ord: i,
        },
      });

      for (let j = 0; j < ch.feedIds.length; j++) {
        await prisma.channelFeed.create({
          data: {
            channelId: channel.id,
            feedId: ch.feedIds[j],
            ord: j,
          },
        });
      }
    }
  }
  console.log(`   ✓ ${CONFLICT_COLLECTIONS.length} collections`);

  // ─── 10. Economic Indexes ───────────────────────────────────────────────────
  console.log('10. Economic indexes...');
  await prisma.economicIndex.createMany({
    data: ECONOMIC_INDEXES.map(idx => ({
      id: idx.id,
      ticker: idx.ticker,
      name: idx.name,
      shortName: idx.shortName,
      category: idx.category,
      tier: idx.tier,
      unit: idx.unit,
      description: idx.description,
      color: idx.color,
    })),
  });
  console.log(`   ✓ ${ECONOMIC_INDEXES.length} indexes`);

  // ─── 11. Prediction Groups ──────────────────────────────────────────────────
  console.log('11. Prediction groups...');
  await prisma.predictionGroup.createMany({
    data: MARKET_GROUPS.map((g, i) => ({
      id: g.id,
      label: g.label,
      description: g.description,
      color: g.color,
      bg: g.bg,
      border: g.border,
      titleMatches: g.titleMatches,
      ord: i,
    })),
  });
  console.log(`   ✓ ${MARKET_GROUPS.length} groups`);

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n=== Seed complete ===');
  const counts = {
    conflicts: await prisma.conflict.count(),
    daySnapshots: await prisma.conflictDaySnapshot.count(),
    casualties: await prisma.casualtySummary.count(),
    chips: await prisma.economicImpactChip.count(),
    scenarios: await prisma.scenario.count(),
    actors: await prisma.actor.count(),
    actorSnapshots: await prisma.actorDaySnapshot.count(),
    actorActions: await prisma.actorAction.count(),
    events: await prisma.intelEvent.count(),
    sources: await prisma.eventSource.count(),
    responses: await prisma.eventActorResponse.count(),
    xPosts: await prisma.xPost.count(),
    mapFeatures: await prisma.mapFeature.count(),
    mapStories: await prisma.mapStory.count(),
    storyEvents: await prisma.mapStoryEvent.count(),
    rssFeeds: await prisma.rssFeed.count(),
    collections: await prisma.conflictCollection.count(),
    channels: await prisma.conflictChannel.count(),
    channelFeeds: await prisma.channelFeed.count(),
    econIndexes: await prisma.economicIndex.count(),
    predictionGroups: await prisma.predictionGroup.count(),
  };
  console.table(counts);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
