/*
  Warnings:

  - The `completedAt` column on the `TaskTracking` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ProgressTracker" ADD COLUMN     "expectedCompletionDate" TIMESTAMP(3),
ADD COLUMN     "forecastStatus" TEXT;

-- AlterTable
ALTER TABLE "TaskTracking" DROP COLUMN "completedAt",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ALTER COLUMN "completionDuration" SET DATA TYPE DOUBLE PRECISION;
