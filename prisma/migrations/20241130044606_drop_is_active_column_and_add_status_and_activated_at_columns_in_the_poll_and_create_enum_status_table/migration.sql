/*
  Warnings:

  - You are about to drop the column `isActive` on the `Poll` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "isActive",
ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "status" "PollStatus" NOT NULL DEFAULT 'DRAFT';
