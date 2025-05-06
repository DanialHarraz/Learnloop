/*
  Warnings:

  - Made the column `downloads` on table `Resource` required. This step will fail if there are existing NULL values in that column.
  - Made the column `views` on table `Resource` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Resource_uploadedBy_idx";

-- DropIndex
DROP INDEX "Resource_url_key";

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "downloads" SET NOT NULL,
ALTER COLUMN "downloads" SET DEFAULT 0,
ALTER COLUMN "views" SET NOT NULL,
ALTER COLUMN "views" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "TaskTracking" ALTER COLUMN "status" SET DEFAULT 'STARTED';
