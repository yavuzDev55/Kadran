-- v4: new time models + recurring tasks stored as real rows (series).
--
-- DATA NOTE: recurring tasks used to be a single row that was expanded on the fly. They are
-- now one real row per occurrence, so the old recurring rows (and their per-date completion
-- records) cannot be converted and are deleted here. Non-recurring tasks are kept.

-- 1) Remove old recurring tasks (task_tags / task_schedules / task_completions cascade)
DELETE FROM "tasks" WHERE "isRecurring" = true;

-- 2) Rename the time types in place (existing rows keep working)
ALTER TYPE "TimeType" RENAME VALUE 'TIMED_OPEN' TO 'OPEN_ENDED';
ALTER TYPE "TimeType" RENAME VALUE 'DATE_RANGE' TO 'MULTI_DAY';
ALTER TYPE "TimeType" RENAME VALUE 'ANYTIME' TO 'ANY_TIME';

-- 3) DEADLINE now carries a due time (stored in "endTime"); existing deadlines end at 23:59
UPDATE "tasks" SET "startTime" = NULL, "endTime" = '23:59' WHERE "timeType" = 'DEADLINE';

-- 4) Drop what the series model replaces
DROP TABLE "task_completions";
DROP TABLE "task_schedules";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "isFlexibleSchedule",
DROP COLUMN "schedulePattern",
DROP COLUMN "isRecurring",
DROP COLUMN "recurrencePattern",
DROP COLUMN "recurrenceStart",
DROP COLUMN "recurrenceEnd",
DROP COLUMN "recurrenceDays",
DROP COLUMN "recurrenceDay",
DROP COLUMN "rangeStartTime",
DROP COLUMN "rangeEndTime",
ADD COLUMN     "seriesId" INTEGER;

-- CreateTable
CREATE TABLE "task_series" (
    "id" SERIAL NOT NULL,
    "pattern" "RecurrencePattern" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "weekDays" TEXT,
    "monthDay" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_series_userId_idx" ON "task_series"("userId");

-- CreateIndex
CREATE INDEX "tasks_seriesId_idx" ON "tasks"("seriesId");

-- AddForeignKey
ALTER TABLE "task_series" ADD CONSTRAINT "task_series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "task_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
