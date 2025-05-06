/*
  Warnings:

  - The values [DRAFT] on the enum `PollStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `activatedAt` on the `Poll` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PollStatus_new" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED');
ALTER TABLE "Poll" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Poll" ALTER COLUMN "status" TYPE "PollStatus_new" USING ("status"::text::"PollStatus_new");
ALTER TYPE "PollStatus" RENAME TO "PollStatus_old";
ALTER TYPE "PollStatus_new" RENAME TO "PollStatus";
DROP TYPE "PollStatus_old";
ALTER TABLE "Poll" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "activatedAt",
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
