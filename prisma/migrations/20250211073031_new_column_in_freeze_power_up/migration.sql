-- CreateEnum
CREATE TYPE "FreezeStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- AlterTable
ALTER TABLE "FreezePowerUp" ADD COLUMN     "status" "FreezeStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Streak" ALTER COLUMN "updatedAt" DROP NOT NULL;
