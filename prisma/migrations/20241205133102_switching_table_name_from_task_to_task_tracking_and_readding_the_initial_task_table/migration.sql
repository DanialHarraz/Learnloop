-- CreateTable
CREATE TABLE "TaskTracking" (
    "id" SERIAL NOT NULL,
    "progressTrackerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completionDuration" INTEGER,

    CONSTRAINT "TaskTracking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskTracking" ADD CONSTRAINT "TaskTracking_progressTrackerId_fkey" FOREIGN KEY ("progressTrackerId") REFERENCES "ProgressTracker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
