import { z } from 'zod';

export const LEADERSHIP_PERSON_STATUSES = ['ALIVE', 'DEAD', 'UNKNOWN', 'VACANT'] as const;
export const LEADERSHIP_RELATION_TYPES = ['REPORTS_TO', 'ADVISES', 'COORDINATES_WITH', 'SUCCESSION'] as const;
export const LEADERSHIP_CONTROL_STATUSES = ['STABLE', 'VACANT', 'DISPUTED', 'UNKNOWN'] as const;

const requiredString = z.string().trim().min(1, 'Required');
const optionalString = z.string().trim().min(1).optional();
const dayString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const metadataSchema = z.record(z.string(), z.unknown()).optional();
const nullableString = z.string().trim().min(1).nullable().optional();
const nullableUrlString = z.url().nullable().optional();

export const leadershipPersonSchema = z.object({
  id: requiredString,
  name: requiredString,
  status: z.enum(LEADERSHIP_PERSON_STATUSES),
  kind: optionalString,
  summary: optionalString,
  metadata: metadataSchema,
}).strict();

export const leadershipRoleSchema = z.object({
  id: requiredString,
  title: requiredString,
  level: z.coerce.number().int().min(0).max(12),
  ord: z.coerce.number().int().min(0).default(0),
  description: optionalString,
  metadata: metadataSchema,
}).strict();

export const leadershipRelationSchema = z.object({
  id: optionalString,
  fromRoleId: requiredString,
  toRoleId: requiredString,
  relationType: z.enum(LEADERSHIP_RELATION_TYPES),
  ord: z.coerce.number().int().min(0).default(0),
  metadata: metadataSchema,
}).strict().superRefine((value, ctx) => {
  if (value.fromRoleId === value.toRoleId) {
    ctx.addIssue({ code: 'custom', message: 'fromRoleId and toRoleId must differ', path: ['toRoleId'] });
  }
});

export const leadershipTenureSchema = z.object({
  id: requiredString,
  roleId: requiredString,
  personId: optionalString.nullable(),
  startDate: dayString,
  endDate: dayString.optional(),
  isActive: z.boolean().default(false),
  isActing: z.boolean().default(false),
  isNominee: z.boolean().default(false),
  startReason: optionalString,
  endReason: optionalString,
  predecessorTenureId: optionalString,
  successorTenureId: optionalString,
  metadata: metadataSchema,
}).strict().superRefine((value, ctx) => {
  if (value.isActive && value.endDate) {
    ctx.addIssue({ code: 'custom', message: 'Active tenures cannot have endDate', path: ['endDate'] });
  }
  if (!value.personId && !value.isNominee && !value.isActing) {
    ctx.addIssue({ code: 'custom', message: 'Vacant tenures must be acting or nominee entries', path: ['personId'] });
  }
});

export const leadershipControlStateSchema = z.object({
  roleId: requiredString,
  deFactoPersonId: optionalString.nullable(),
  deJurePersonId: optionalString.nullable(),
  status: z.enum(LEADERSHIP_CONTROL_STATUSES),
  contested: z.boolean().default(false),
  note: optionalString,
  metadata: metadataSchema,
}).strict();

export const leadershipEventLinkSchema = z.object({
  id: optionalString,
  eventId: requiredString,
  roleId: optionalString,
  personId: optionalString,
  tenureId: optionalString,
  kind: requiredString,
  ord: z.coerce.number().int().min(0).default(0),
  metadata: metadataSchema,
}).strict().superRefine((value, ctx) => {
  if (!value.roleId && !value.personId && !value.tenureId) {
    ctx.addIssue({ code: 'custom', message: 'At least one of roleId, personId, or tenureId is required', path: ['roleId'] });
  }
});

export const leadershipBatchUpsertSchema = z.object({
  persons: z.array(leadershipPersonSchema).default([]),
  roles: z.array(leadershipRoleSchema).default([]),
  relations: z.array(leadershipRelationSchema).default([]),
  tenures: z.array(leadershipTenureSchema).default([]),
  controlStates: z.array(leadershipControlStateSchema).default([]),
  eventLinks: z.array(leadershipEventLinkSchema).default([]),
  pruneMissing: z.boolean().default(false),
}).strict();

export const leadershipPersonPatchSchema = z.object({
  name: nullableString,
  status: z.enum(LEADERSHIP_PERSON_STATUSES).optional(),
  kind: nullableString,
  summary: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  wikipediaQuery: nullableString,
  wikipediaTitle: nullableString,
  wikipediaPageUrl: nullableUrlString,
  wikipediaImageUrl: nullableUrlString,
  wikipediaResolvedAt: z.iso.datetime({ offset: true }).nullable().optional(),
}).strict().refine(value => Object.keys(value).length > 0, {
  message: 'At least one field must be provided',
});

export type LeadershipBatchUpsert = z.infer<typeof leadershipBatchUpsertSchema>;
export type LeadershipPersonPatch = z.infer<typeof leadershipPersonPatchSchema>;
