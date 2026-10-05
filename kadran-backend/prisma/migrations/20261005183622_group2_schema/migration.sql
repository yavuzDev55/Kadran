-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TimeType" ADD VALUE 'TIMED_OPEN';
ALTER TYPE "TimeType" ADD VALUE 'ANYTIME';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "color" TEXT,
ADD COLUMN     "isCompletable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;
