-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('COMPLETED', 'ONGOING', 'NOT_BEGUN');

-- CreateTable
CREATE TABLE "ProgressTracker" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL, 
    "deadline" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "progressPercentage" INTEGER,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_BEGUN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressTracker_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProgressTracker" ADD CONSTRAINT "ProgressTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
