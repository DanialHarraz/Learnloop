/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `FreezePowerUp` table. All the data in the column will be lost.
  - You are about to drop the column `usesLeft` on the `FreezePowerUp` table. All the data in the column will be lost.
  - Added the required column `freezeUntil` to the `FreezePowerUp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StreakStatus" AS ENUM ('ACTIVE', 'FROZEN', 'BROKEN', 'INACTIVE');

-- AlterTable
ALTER TABLE "FreezePowerUp" DROP COLUMN "updatedAt",
DROP COLUMN "usesLeft",
ADD COLUMN     "freezeUntil" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Streak" ADD COLUMN     "status" "StreakStatus" NOT NULL DEFAULT 'INACTIVE';
