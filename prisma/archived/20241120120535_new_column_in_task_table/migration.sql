-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "sharedWith" TEXT;

-- AlterTable
ALTER TABLE "TaskTracker" ADD COLUMN     "completedAt" TIMESTAMP(3);
