-- CreateTable
CREATE TABLE "task_completions" (
    "id" SERIAL NOT NULL,
    "occurrenceDate" DATE NOT NULL,
    "taskId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_completions_taskId_idx" ON "task_completions"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "task_completions_taskId_occurrenceDate_key" ON "task_completions"("taskId", "occurrenceDate");

-- AddForeignKey
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
