ALTER TABLE "Conflict"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE "MapFeature"
ADD COLUMN "sourceEventId" TEXT;

ALTER TABLE "MapStory"
ADD COLUMN "primaryEventId" TEXT,
ADD COLUMN "sourceEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "Conflict"
SET "timezone" = 'Europe/Stockholm'
WHERE "id" = 'iran-2026';

ALTER TABLE "MapStory"
ALTER COLUMN "sourceEventIds" SET NOT NULL,
ALTER COLUMN "sourceEventIds" DROP DEFAULT;

CREATE INDEX "MapFeature_sourceEventId_idx" ON "MapFeature"("sourceEventId");
CREATE INDEX "MapFeature_conflictId_sourceEventId_idx" ON "MapFeature"("conflictId", "sourceEventId");
CREATE INDEX "MapStory_primaryEventId_idx" ON "MapStory"("primaryEventId");
