/*
  Warnings:

  - You are about to drop the column `status` on the `Assignment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "status";

-- DropEnum
DROP TYPE "AssignmentStatus";
