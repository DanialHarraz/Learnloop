/*
  Warnings:

  - You are about to drop the column `isActive` on the `AccountabilityPartner` table. All the data in the column will be lost.
  - You are about to drop the column `notified` on the `AccountabilityPartner` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "AccountabilityPartner" DROP COLUMN "isActive",
DROP COLUMN "notified",
ADD COLUMN     "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Forum" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "inactiveDays" INTEGER NOT NULL DEFAULT 0;
