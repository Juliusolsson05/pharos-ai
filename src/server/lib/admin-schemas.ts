import { isValid, parseISO } from 'date-fns';
import { z } from 'zod';

import {
  INSTALLATION_STATUSES,
  INSTALLATION_TYPES,
  KINETIC_STATUSES,
  KINETIC_TYPES,
  MAP_ACTOR_KEYS,
  MAP_PRIORITIES,
  STORY_ICON_NAMES,
  ZONE_TYPES,
} from './admin-validate';

import {
  AccountType,
  ActionSignificance,
  ActionType,
  ActivityLevel,
  ActorResponseStance,
  ConflictStatus,
  EventType,
  PostType,
  Severity,
  SignificanceLevel,
  Stance,
  StoryCategory,
  StoryEventType,
  ThreatLevel,
} from '@/generated/prisma/client';

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

const requiredString = z.string().trim().min(1, 'Required');
const optionalNonEmptyString = z.string().trim().min(1).optional();
const optionalUrlString = z.string().trim().url().optional();
const optionalNumericString = z
  .string()
  .trim()
  .regex(/^\d+$/, 'tweetId must be a numeric string')
  .optional();

const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDateTime(value: string): boolean {
  return ISO_DATE_TIME_PATTERN.test(value) && isValid(parseISO(value));
}

function isDayString(value: string): boolean {
  if (!DAY_PATTERN.test(value)) return false;
  const parsed = parseISO(`${value}T00:00:00Z`);
  return isValid(parsed) && parsed.toISOString().slice(0, 10) === value;
}

const isoDateTime = z.string().refine(isIsoDateTime, 'Invalid ISO date string');
const optionalIsoDateTime = z
  .string()
  .refine(isIsoDateTime, 'Invalid ISO date string')
  .optional();
const dayString = z
  .string()
  .regex(DAY_PATTERN, 'Invalid day format, expected YYYY-MM-DD')
  .refine(isDayString, 'Invalid day format, expected YYYY-MM-DD');
const stringArray = z.array(requiredString);
const optionalStringArray = stringArray.optional();

/* ------------------------------------------------------------------ */
/* Shared nested schemas                                               */
/* ------------------------------------------------------------------ */

const sourceSchema = z
  .object({
    name: requiredString,
    tier: z.coerce.number().int().min(1).max(5),
    reliability: z.coerce.number().int().min(0).max(100),
    url: optionalUrlString,
  })
  .strict();

const actorResponseSchema = z
  .object({
    actorId: requiredString,
    actorName: requiredString,
    stance: z.nativeEnum(ActorResponseStance),
    type: requiredString,
    statement: requiredString,
  })
  .strict();

const casualtySchema = z
  .object({
    faction: requiredString,
    killed: z.coerce.number().int().min(0).optional(),
    wounded: z.coerce.number().int().min(0).optional(),
    civilians: z.coerce.number().int().min(0).optional(),
    injured: z.coerce.number().int().min(0).optional(),
  })
  .strict();

const economicChipSchema = z
  .object({
    label: requiredString,
    val: requiredString,
    sub: requiredString,
    color: requiredString,
  })
  .strict();

const scenarioSchema = z
  .object({
    label: requiredString,
    subtitle: requiredString,
    color: requiredString,
    prob: requiredString,
    body: requiredString,
  })
  .strict();

const storyViewStateSchema = z
  .object({
    longitude: z.coerce.number().min(-180).max(180),
    latitude: z.coerce.number().min(-90).max(90),
    zoom: z.coerce.number().min(0).max(24),
  })
  .strict();

const mapStoryEventSchema = z
  .object({
    time: isoDateTime,
    label: requiredString,
    type: z.nativeEnum(StoryEventType),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Map feature geometry schemas                                        */
/* ------------------------------------------------------------------ */

const latLngSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const arcGeometrySchema = z
  .object({
    from: latLngSchema,
    to: latLngSchema,
  })
  .strict();

const pointGeometrySchema = z
  .object({
    position: latLngSchema,
  })
  .strict();

const polygonGeometrySchema = z
  .object({
    coordinates: z.array(z.array(z.coerce.number()).min(2).max(3)).min(3),
  })
  .strict();

const strikeArcPropertiesSchema = z
  .object({
    label: requiredString,
  })
  .passthrough();

const threatZonePropertiesSchema = z
  .object({
    name: requiredString,
    color: requiredString,
  })
  .passthrough();

/* ------------------------------------------------------------------ */
/* Map feature base (shared across all 6 feature types)                */
/* ------------------------------------------------------------------ */

const mapFeatureBase = {
  id: requiredString,
  actor: z.enum(MAP_ACTOR_KEYS),
  priority: z.enum(MAP_PRIORITIES),
  category: requiredString,
  sourceEventId: optionalNonEmptyString,
  timestamp: optionalIsoDateTime,
  properties: z.record(z.string(), z.unknown()).optional(),
};

/* ------------------------------------------------------------------ */
/* Event schemas                                                       */
/* ------------------------------------------------------------------ */

export const adminEventCreateSchema = z
  .object({
    id: requiredString,
    timestamp: isoDateTime,
    severity: z.nativeEnum(Severity),
    type: z.nativeEnum(EventType),
    title: requiredString,
    location: requiredString,
    summary: requiredString,
    fullContent: requiredString,
    verified: z.boolean().optional(),
    tags: optionalStringArray,
    sources: z.array(sourceSchema).optional(),
    actorResponses: z.array(actorResponseSchema).optional(),
  })
  .strict();

export const adminEventUpdateSchema = z
  .object({
    severity: z.nativeEnum(Severity).optional(),
    type: z.nativeEnum(EventType).optional(),
    timestamp: isoDateTime.optional(),
    title: requiredString.optional(),
    location: requiredString.optional(),
    summary: requiredString.optional(),
    fullContent: requiredString.optional(),
    verified: z.boolean().optional(),
    tags: stringArray.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if ('sources' in value) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Cannot update sources via PUT /events/{id}. Use POST /events/{id}/sources.',
      });
    }
    if ('actorResponses' in value) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Cannot update actorResponses via PUT /events/{id}. Use POST /actors/{actorId}/responses.',
      });
    }
  });

export const adminEventSourcesSchema = z
  .object({
    sources: z.array(sourceSchema).min(1, 'sources array must not be empty'),
  })
  .strict();

export const adminBulkEventsSchema = z
  .object({
    events: z
      .array(adminEventCreateSchema)
      .min(1, 'events array must not be empty')
      .max(50, 'Maximum 50 events per bulk request'),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* X-post schemas                                                      */
/* ------------------------------------------------------------------ */

export const adminXPostCreateSchema = z
  .object({
    id: requiredString,
    tweetId: optionalNumericString,
    postType: z.nativeEnum(PostType).default(PostType.XPOST),
    handle: requiredString,
    displayName: requiredString,
    avatar: z.string().trim().optional(),
    avatarColor: z.string().trim().optional(),
    verified: z.boolean().optional(),
    accountType: z.nativeEnum(AccountType),
    significance: z.nativeEnum(SignificanceLevel),
    timestamp: isoDateTime,
    content: requiredString,
    images: stringArray.optional(),
    videoThumb: optionalNonEmptyString,
    likes: z.coerce.number().int().min(0).optional(),
    retweets: z.coerce.number().int().min(0).optional(),
    replies: z.coerce.number().int().min(0).optional(),
    views: z.coerce.number().int().min(0).optional(),
    pharosNote: optionalNonEmptyString,
    eventId: optionalNonEmptyString,
    actorId: optionalNonEmptyString,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.postType === PostType.XPOST && !value.tweetId) {
      ctx.addIssue({
        code: 'custom',
        path: ['tweetId'],
        message: 'tweetId is required when postType is XPOST.',
      });
    }
  });

export const adminXPostUpdateSchema = z
  .object({
    handle: requiredString.optional(),
    displayName: requiredString.optional(),
    content: requiredString.optional(),
    significance: z.nativeEnum(SignificanceLevel).optional(),
    accountType: z.nativeEnum(AccountType).optional(),
    timestamp: isoDateTime.optional(),
    avatar: z.string().trim().optional(),
    avatarColor: z.string().trim().optional(),
    verified: z.boolean().optional(),
    images: stringArray.optional(),
    videoThumb: z.string().trim().nullable().optional(),
    likes: z.coerce.number().int().min(0).optional(),
    retweets: z.coerce.number().int().min(0).optional(),
    replies: z.coerce.number().int().min(0).optional(),
    views: z.coerce.number().int().min(0).optional(),
    pharosNote: z.string().trim().nullable().optional(),
    eventId: z.string().trim().nullable().optional(),
    actorId: z.string().trim().nullable().optional(),
  })
  .strict();

export const adminBulkXPostsSchema = z
  .object({
    posts: z
      .array(adminXPostCreateSchema)
      .min(1, 'posts array must not be empty')
      .max(50, 'Maximum 50 posts per bulk request'),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Day snapshot schemas                                                */
/* ------------------------------------------------------------------ */

export const adminDaySnapshotCreateSchema = z
  .object({
    day: dayString,
    dayLabel: requiredString,
    summary: requiredString,
    keyFacts: optionalStringArray,
    escalation: z.coerce.number().int().min(0).max(100),
    economicNarrative: z.string().trim().optional(),
    casualties: z.array(casualtySchema).optional(),
    economicChips: z.array(economicChipSchema).optional(),
    scenarios: z.array(scenarioSchema).optional(),
  })
  .strict();

export const adminDaySnapshotUpdateSchema = z
  .object({
    dayLabel: requiredString.optional(),
    summary: requiredString.optional(),
    keyFacts: optionalStringArray,
    escalation: z.coerce.number().int().min(0).max(100).optional(),
    economicNarrative: z.string().trim().optional(),
    casualties: z.array(casualtySchema).optional(),
    economicChips: z.array(economicChipSchema).optional(),
    scenarios: z.array(scenarioSchema).optional(),
  })
  .strict();

export const adminCasualtiesUpsertSchema = z
  .object({
    day: dayString,
    casualties: z
      .array(casualtySchema)
      .min(1, 'casualties must be a non-empty array'),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Actor schemas                                                       */
/* ------------------------------------------------------------------ */

export const adminActorUpdateSchema = z
  .object({
    activityLevel: z.nativeEnum(ActivityLevel).optional(),
    stance: z.nativeEnum(Stance).optional(),
    activityScore: z.coerce.number().int().min(0).max(100).optional(),
    saying: requiredString.optional(),
    doing: stringArray.optional(),
    assessment: requiredString.optional(),
    keyFigures: stringArray.optional(),
    linkedEventIds: stringArray.optional(),
  })
  .strict();

export const adminActorSnapshotCreateSchema = z
  .object({
    day: dayString,
    activityLevel: z.nativeEnum(ActivityLevel),
    activityScore: z.coerce.number().int().min(0).max(100),
    stance: z.nativeEnum(Stance),
    saying: requiredString,
    doing: stringArray,
    assessment: requiredString,
  })
  .strict();

export const adminActorSnapshotUpdateSchema = z
  .object({
    activityLevel: z.nativeEnum(ActivityLevel).optional(),
    stance: z.nativeEnum(Stance).optional(),
    activityScore: z.coerce.number().int().min(0).max(100).optional(),
    saying: requiredString.optional(),
    doing: stringArray.optional(),
    assessment: requiredString.optional(),
  })
  .strict();

export const adminActorResponseCreateSchema = z
  .object({
    eventId: requiredString,
    stance: z.nativeEnum(ActorResponseStance),
    type: requiredString,
    statement: requiredString,
  })
  .strict();

export const adminActorActionCreateSchema = z
  .object({
    date: requiredString,
    type: z.nativeEnum(ActionType),
    description: requiredString,
    significance: z.nativeEnum(ActionSignificance),
    verified: z.boolean().optional(),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Map story schemas                                                   */
/* ------------------------------------------------------------------ */

export const adminMapStoryCreateSchema = z
  .object({
    id: requiredString,
    primaryEventId: optionalNonEmptyString,
    sourceEventIds: stringArray.optional(),
    title: requiredString,
    tagline: requiredString,
    iconName: z.enum(STORY_ICON_NAMES),
    category: z.nativeEnum(StoryCategory),
    narrative: requiredString,
    highlightStrikeIds: stringArray.optional(),
    highlightMissileIds: stringArray.optional(),
    highlightTargetIds: stringArray.optional(),
    highlightAssetIds: stringArray.optional(),
    viewState: storyViewStateSchema,
    keyFacts: optionalStringArray,
    timestamp: isoDateTime,
    events: z.array(mapStoryEventSchema).min(1, 'Stories must have at least 1 timeline event'),
  })
  .strict()
  .refine(
    (v) => v.primaryEventId || (v.sourceEventIds && v.sourceEventIds.length > 0),
    {
      message:
        'At least one of primaryEventId or sourceEventIds is required. Stories must be linked to events.',
      path: ['primaryEventId'],
    },
  );

export const adminMapStoryUpdateSchema = z
  .object({
    title: requiredString.optional(),
    tagline: requiredString.optional(),
    iconName: z.enum(STORY_ICON_NAMES).optional(),
    category: z.nativeEnum(StoryCategory).optional(),
    narrative: requiredString.optional(),
    primaryEventId: z.string().trim().nullable().optional(),
    sourceEventIds: stringArray.optional(),
    highlightStrikeIds: stringArray.optional(),
    highlightMissileIds: stringArray.optional(),
    highlightTargetIds: stringArray.optional(),
    highlightAssetIds: stringArray.optional(),
    viewState: storyViewStateSchema.optional(),
    keyFacts: stringArray.optional(),
    timestamp: isoDateTime.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if ('events' in value) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Cannot update story events via PUT /map/stories/{id}. Use PUT /map/stories/{id}/events to replace all events, or POST /map/stories/{id}/events to append.',
      });
    }
  });

export const adminStoryEventsAppendSchema = z
  .object({
    events: z
      .array(mapStoryEventSchema)
      .min(1, 'events array must not be empty'),
  })
  .strict();

export const adminStoryEventsReplaceSchema = z
  .object({
    events: z.array(mapStoryEventSchema),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Map feature create schemas (6 feature types)                        */
/* ------------------------------------------------------------------ */

export const adminStrikeArcCreateSchema = z
  .object({
    ...mapFeatureBase,
    type: z.enum(KINETIC_TYPES),
    status: z.enum(KINETIC_STATUSES).nullable().optional(),
    geometry: arcGeometrySchema,
    properties: strikeArcPropertiesSchema,
  })
  .strict();

export const adminMissileTrackCreateSchema = z
  .object({
    ...mapFeatureBase,
    type: z.enum(KINETIC_TYPES),
    status: z.enum(KINETIC_STATUSES).nullable().optional(),
    geometry: arcGeometrySchema,
  })
  .strict();

export const adminTargetCreateSchema = z
  .object({
    ...mapFeatureBase,
    type: z.enum(INSTALLATION_TYPES),
    status: z.enum(INSTALLATION_STATUSES).nullable().optional(),
    geometry: pointGeometrySchema,
  })
  .strict();

export const adminAssetCreateSchema = z
  .object({
    ...mapFeatureBase,
    type: z.enum(INSTALLATION_TYPES),
    status: z.enum(INSTALLATION_STATUSES).nullable().optional(),
    geometry: pointGeometrySchema,
  })
  .strict();

export const adminThreatZoneCreateSchema = z
  .object({
    ...mapFeatureBase,
    type: z.enum(ZONE_TYPES),
    status: z.string().trim().nullable().optional(),
    geometry: polygonGeometrySchema,
    properties: threatZonePropertiesSchema,
  })
  .strict();

export const adminHeatPointCreateSchema = z
  .object({
    ...mapFeatureBase,
    type: requiredString,
    status: z.string().trim().nullable().optional(),
    geometry: pointGeometrySchema,
  })
  .strict();

/* Map feature update (partial, any type — enum validation is          */
/* context-dependent so the route determines valid type/status)         */

export const adminMapFeatureUpdateSchema = z
  .object({
    actor: z.enum(MAP_ACTOR_KEYS).optional(),
    priority: z.enum(MAP_PRIORITIES).optional(),
    category: requiredString.optional(),
    type: requiredString.optional(),
    status: z.string().trim().nullable().optional(),
    geometry: z.record(z.string(), z.unknown()).optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
    timestamp: isoDateTime.nullable().optional(),
    sourceEventId: z.string().trim().nullable().optional(),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Conflict update schema                                              */
/* ------------------------------------------------------------------ */

export const adminConflictUpdateSchema = z
  .object({
    status: z.nativeEnum(ConflictStatus).optional(),
    threatLevel: z.nativeEnum(ThreatLevel).optional(),
    escalation: z.coerce.number().int().min(0).max(100).optional(),
    name: requiredString.optional(),
    summary: requiredString.optional(),
    keyFacts: stringArray.optional(),
    timezone: requiredString.optional(),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Verify schemas                                                      */
/* ------------------------------------------------------------------ */

export const adminVerifyPostSchema = z
  .object({
    postId: requiredString,
  })
  .strict();

export const adminVerifyBatchSchema = z
  .object({
    postIds: z.array(requiredString).max(20).optional(),
    filter: z
      .object({
        status: requiredString.optional(),
        postType: requiredString.optional(),
        limit: z.coerce.number().int().min(1).max(20).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const adminVerifySearchSchema = z
  .object({
    query: requiredString,
    maxResults: z.coerce.number().int().min(1).max(25).optional(),
    handles: z.array(requiredString).max(10).optional(),
    fromDate: requiredString.optional(),
    toDate: requiredString.optional(),
    eventId: optionalNonEmptyString,
  })
  .strict();
