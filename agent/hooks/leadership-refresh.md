# Leadership Refresh — On-Demand Hook

You are handling an on-demand leadership refresh triggered by a webhook for conflict **{conflictId}**.

## Trigger Payload

- `actorId` (required) — which actor's tree to update. If missing, return an error immediately.
- `note` (optional) — describes what changed (e.g. "Khamenei died", "new defense minister appointed"). Guides your search or may be sufficient on its own.

## API Endpoints

Base path: `/api/v1/admin/{conflictId}/actors/{actorId}/leadership`

All requests require the `Authorization` header.

### 1. GET `/workspace`

Returns the raw editable state for this actor's tree.

**Response** `{ ok, data }` where `data` contains:
- `actor` — `{ id, name, countryCode }`
- `persons[]` — `{ id, name, status, kind?, summary?, metadata?, wikipediaTitle?, wikipediaPageUrl?, wikipediaImageUrl? }`
- `roles[]` — `{ id, title, level, ord, description?, metadata? }`
- `tenures[]` — `{ id, roleId, personId?, startDate, endDate?, isActive, isActing, isNominee, startReason?, endReason?, metadata? }`
- `relations[]` — `{ id, fromRoleId, toRoleId, relationType, ord, metadata? }`
- `controlStates[]` — `{ roleId, deFactoPersonId?, deJurePersonId?, status, contested, note?, metadata? }`
- `allowedRelationTypes`, `allowedStatuses`, `allowedControlStatuses` — enum references
- `recentEvents[]` — for event linking (optional)

### 2. POST `/validate`

Dry-run validation. Send the same body shape as upsert-batch.

**Body:** `{ persons, roles, tenures, relations, controlStates, eventLinks }`
**Response:** `{ ok, data: { valid: boolean, issues: string[] } }`

### 3. POST `/upsert-batch`

Atomic full-tree replacement. Wikipedia is auto-resolved for new persons (no existing `wikipediaResolvedAt`). You never need to handle Wikipedia yourself.

**Body:** `{ persons, roles, tenures, relations, controlStates, eventLinks }`
**Response:** `{ ok, data: { actorId, updated: true } }`

**Important:** Send the FULL tree every time — this is a replace operation, not a patch. Omitting an entity deletes it.

### 4. GET `/` (root)

Returns the projected leadership tree (read-only, formatted for display). Use this to verify your changes after writing.

**Response:** `{ ok, data }` — structured tree with nested roles, persons, tenures.

## Workflow

### 1. Parse trigger

Read `actorId` from the payload. If absent, return `{ error: "missing actorId" }`.
Read `note` if present.

### 2. Research

- If `note` is **specific** (names a person, describes an event clearly), act on it directly — no web search needed.
- If `note` is **vague** or **absent**, web-search for recent leadership changes for this actor, same as the cron would.
- If no changes are found and no actionable note was given, **NOOP**.

### 3. Read

GET `/workspace` to retrieve the current raw state.

### 4. Update

Modify the payload to reflect the changes:
- **Death:** Set person `status` to `DEAD`, end their active tenure (`endDate`, `isActive: false`, `endReason`), update `controlState` for their role.
- **New person:** Add to `persons[]` with a new ID (kebab-case). Add a tenure linking them to the role. Wikipedia will be auto-resolved on upsert.
- **Succession:** End predecessor tenure, add successor tenure. Update `controlState`.
- **Removal:** End tenure, update `controlState` (status to `VACANT` if no replacement).

POST `/validate` first. Fix any issues before proceeding.
POST `/upsert-batch` with the full corrected tree.

### 5. Verify

GET `/` to confirm the projected tree reflects your changes.

### 6. Return result

Return a structured result:
```json
{
  "actorId": "...",
  "action": "updated | noop",
  "changes": ["description of each change made"],
  "issues": ["any warnings or problems encountered"]
}
```

## Scope

- Only modify this actor's leadership tree.
- Do NOT create events, map features, stories, signals, or x-posts.
- Do NOT touch the main fulfillment workspace.
- Do NOT call any endpoints outside the leadership base path.
