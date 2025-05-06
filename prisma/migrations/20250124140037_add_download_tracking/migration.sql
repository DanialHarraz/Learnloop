-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "lastDownloadedAt" TIMESTAMP(3),
ADD COLUMN     "lastDownloadedBy" INTEGER;
