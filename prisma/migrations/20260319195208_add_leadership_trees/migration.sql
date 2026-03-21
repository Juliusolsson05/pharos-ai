-- DropIndex
DROP INDEX "DocumentEmbedding_embedding_idx";

-- CreateTable
CREATE TABLE "LeadershipPerson" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "kind" TEXT,
    "summary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipPerson_pkey" PRIMARY KEY ("conflictId","actorId","id")
);

-- CreateTable
CREATE TABLE "LeadershipRole" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipRole_pkey" PRIMARY KEY ("conflictId","actorId","id")
);

-- CreateTable
CREATE TABLE "LeadershipRoleRelation" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fromRoleId" TEXT NOT NULL,
    "toRoleId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipRoleRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadershipTenure" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "personId" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isActing" BOOLEAN NOT NULL DEFAULT false,
    "isNominee" BOOLEAN NOT NULL DEFAULT false,
    "startReason" TEXT,
    "endReason" TEXT,
    "predecessorTenureId" TEXT,
    "successorTenureId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipTenure_pkey" PRIMARY KEY ("conflictId","actorId","id")
);

-- CreateTable
CREATE TABLE "LeadershipControlState" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "deFactoPersonId" TEXT,
    "deJurePersonId" TEXT,
    "status" TEXT NOT NULL,
    "contested" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipControlState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadershipEventLink" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "roleId" TEXT,
    "personId" TEXT,
    "tenureId" TEXT,
    "kind" TEXT NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipEventLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadershipPerson_conflictId_actorId_idx" ON "LeadershipPerson"("conflictId", "actorId");

-- CreateIndex
CREATE INDEX "LeadershipRole_conflictId_actorId_level_idx" ON "LeadershipRole"("conflictId", "actorId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "LeadershipRole_conflictId_actorId_ord_key" ON "LeadershipRole"("conflictId", "actorId", "ord");

-- CreateIndex
CREATE INDEX "LeadershipRoleRelation_conflictId_actorId_fromRoleId_idx" ON "LeadershipRoleRelation"("conflictId", "actorId", "fromRoleId");

-- CreateIndex
CREATE INDEX "LeadershipRoleRelation_conflictId_actorId_toRoleId_idx" ON "LeadershipRoleRelation"("conflictId", "actorId", "toRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadershipRoleRelation_conflictId_actorId_fromRoleId_toRole_key" ON "LeadershipRoleRelation"("conflictId", "actorId", "fromRoleId", "toRoleId", "relationType");

-- CreateIndex
CREATE INDEX "LeadershipTenure_conflictId_actorId_roleId_idx" ON "LeadershipTenure"("conflictId", "actorId", "roleId");

-- CreateIndex
CREATE INDEX "LeadershipTenure_conflictId_actorId_personId_idx" ON "LeadershipTenure"("conflictId", "actorId", "personId");

-- CreateIndex
CREATE INDEX "LeadershipTenure_conflictId_actorId_isActive_idx" ON "LeadershipTenure"("conflictId", "actorId", "isActive");

-- CreateIndex
CREATE INDEX "LeadershipControlState_conflictId_actorId_idx" ON "LeadershipControlState"("conflictId", "actorId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadershipControlState_conflictId_actorId_roleId_key" ON "LeadershipControlState"("conflictId", "actorId", "roleId");

-- CreateIndex
CREATE INDEX "LeadershipEventLink_conflictId_actorId_idx" ON "LeadershipEventLink"("conflictId", "actorId");

-- CreateIndex
CREATE INDEX "LeadershipEventLink_eventId_idx" ON "LeadershipEventLink"("eventId");

-- AddForeignKey
ALTER TABLE "LeadershipPerson" ADD CONSTRAINT "LeadershipPerson_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipPerson" ADD CONSTRAINT "LeadershipPerson_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipRole" ADD CONSTRAINT "LeadershipRole_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipRole" ADD CONSTRAINT "LeadershipRole_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipRoleRelation" ADD CONSTRAINT "LeadershipRoleRelation_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipRoleRelation" ADD CONSTRAINT "LeadershipRoleRelation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipRoleRelation" ADD CONSTRAINT "LeadershipRoleRelation_conflictId_actorId_fromRoleId_fkey" FOREIGN KEY ("conflictId", "actorId", "fromRoleId") REFERENCES "LeadershipRole"("conflictId", "actorId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipRoleRelation" ADD CONSTRAINT "LeadershipRoleRelation_conflictId_actorId_toRoleId_fkey" FOREIGN KEY ("conflictId", "actorId", "toRoleId") REFERENCES "LeadershipRole"("conflictId", "actorId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipTenure" ADD CONSTRAINT "LeadershipTenure_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipTenure" ADD CONSTRAINT "LeadershipTenure_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipTenure" ADD CONSTRAINT "LeadershipTenure_conflictId_actorId_roleId_fkey" FOREIGN KEY ("conflictId", "actorId", "roleId") REFERENCES "LeadershipRole"("conflictId", "actorId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipTenure" ADD CONSTRAINT "LeadershipTenure_conflictId_actorId_personId_fkey" FOREIGN KEY ("conflictId", "actorId", "personId") REFERENCES "LeadershipPerson"("conflictId", "actorId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipControlState" ADD CONSTRAINT "LeadershipControlState_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipControlState" ADD CONSTRAINT "LeadershipControlState_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipControlState" ADD CONSTRAINT "LeadershipControlState_conflictId_actorId_roleId_fkey" FOREIGN KEY ("conflictId", "actorId", "roleId") REFERENCES "LeadershipRole"("conflictId", "actorId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipControlState" ADD CONSTRAINT "LeadershipControlState_conflictId_actorId_deFactoPersonId_fkey" FOREIGN KEY ("conflictId", "actorId", "deFactoPersonId") REFERENCES "LeadershipPerson"("conflictId", "actorId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipControlState" ADD CONSTRAINT "LeadershipControlState_conflictId_actorId_deJurePersonId_fkey" FOREIGN KEY ("conflictId", "actorId", "deJurePersonId") REFERENCES "LeadershipPerson"("conflictId", "actorId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipEventLink" ADD CONSTRAINT "LeadershipEventLink_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipEventLink" ADD CONSTRAINT "LeadershipEventLink_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipEventLink" ADD CONSTRAINT "LeadershipEventLink_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "IntelEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipEventLink" ADD CONSTRAINT "LeadershipEventLink_conflictId_actorId_roleId_fkey" FOREIGN KEY ("conflictId", "actorId", "roleId") REFERENCES "LeadershipRole"("conflictId", "actorId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipEventLink" ADD CONSTRAINT "LeadershipEventLink_conflictId_actorId_personId_fkey" FOREIGN KEY ("conflictId", "actorId", "personId") REFERENCES "LeadershipPerson"("conflictId", "actorId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipEventLink" ADD CONSTRAINT "LeadershipEventLink_conflictId_actorId_tenureId_fkey" FOREIGN KEY ("conflictId", "actorId", "tenureId") REFERENCES "LeadershipTenure"("conflictId", "actorId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
