/*
  Warnings:

  - The values [COMPLETED] on the enum `AssignmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lastDownloadedAt` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `lastDownloadedBy` on the `Resource` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentStatus_new" AS ENUM ('UPCOMING', 'DUE', 'OVERDUE', 'CLOSED', 'ARCHIVED');
ALTER TABLE "Assignment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Assignment" ALTER COLUMN "status" TYPE "AssignmentStatus_new" USING ("status"::text::"AssignmentStatus_new");
ALTER TYPE "AssignmentStatus" RENAME TO "AssignmentStatus_old";
ALTER TYPE "AssignmentStatus_new" RENAME TO "AssignmentStatus";
DROP TYPE "AssignmentStatus_old";
ALTER TABLE "Assignment" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';
COMMIT;

-- DropIndex
DROP INDEX "Resource_url_key";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "lastDownloadedAt",
DROP COLUMN "lastDownloadedBy";
