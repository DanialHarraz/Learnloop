-- DropForeignKey
ALTER TABLE "TaskTracking" DROP CONSTRAINT "Task_progressTrackerId_fkey";

-- AddForeignKey
ALTER TABLE "TaskTracking" ADD CONSTRAINT "Task_progressTrackerId_fkey" FOREIGN KEY ("progressTrackerId") REFERENCES "ProgressTracker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
