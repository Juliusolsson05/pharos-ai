-- AlterTable
ALTER TABLE "LeadershipPerson" ADD COLUMN     "wikipediaImageUrl" TEXT,
ADD COLUMN     "wikipediaPageUrl" TEXT,
ADD COLUMN     "wikipediaQuery" TEXT,
ADD COLUMN     "wikipediaResolvedAt" TIMESTAMP(3),
ADD COLUMN     "wikipediaTitle" TEXT;
