/*
  Warnings:

  - You are about to drop the column `sharedWith` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `statusId` on the `Task` table. All the data in the column will be lost.
  - Added the required column `progressTrackerId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_statusId_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignment" DROP CONSTRAINT "TaskAssignment_taskId_fkey";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "sharedWith";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "name",
DROP COLUMN "statusId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "progressTrackerId" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_progressTrackerId_fkey" FOREIGN KEY ("progressTrackerId") REFERENCES "ProgressTracker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
