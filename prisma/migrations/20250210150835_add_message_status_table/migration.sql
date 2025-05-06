-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'SEEN');

-- AlterTable
ALTER TABLE "StudyGroupMessage" ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'SENT';
