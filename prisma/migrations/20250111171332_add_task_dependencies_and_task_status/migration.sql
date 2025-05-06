-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'STARTED', 'COMPLETED', 'LOCKED');

-- AlterTable
ALTER TABLE "TaskTracking" ADD COLUMN     "dependsOn" INTEGER,
ADD COLUMN     "isClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "TaskTracking" ADD CONSTRAINT "TaskTracking_dependsOn_fkey" FOREIGN KEY ("dependsOn") REFERENCES "TaskTracking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
