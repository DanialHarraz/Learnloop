/*
  Warnings:

  - The values [PENDING] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('INCOMPLETE', 'STARTED', 'COMPLETED', 'LOCKED');
ALTER TABLE "TaskTracking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TaskTracking" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";
ALTER TABLE "TaskTracking" ALTER COLUMN "status" SET DEFAULT 'LOCKED';
COMMIT;

-- AlterTable
ALTER TABLE "TaskTracking" ALTER COLUMN "status" SET DEFAULT 'LOCKED';
