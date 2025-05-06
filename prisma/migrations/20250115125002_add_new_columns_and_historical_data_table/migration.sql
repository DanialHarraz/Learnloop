-- Add new columns
ALTER TABLE "TaskTracking" 
    ADD COLUMN "estimatedDuration" DOUBLE PRECISION NOT NULL,
    ADD COLUMN "scheduleStatus" TEXT,
    ADD COLUMN "startedAt" TIMESTAMP(3),
    ALTER COLUMN "status" SET DEFAULT 'INCOMPLETE';

-- Alter the completedAt column to store a float (epoch time)
ALTER TABLE "TaskTracking" 
    ALTER COLUMN "completedAt" TYPE FLOAT 
    USING EXTRACT(EPOCH FROM "completedAt")::FLOAT,
    ALTER COLUMN "completedAt" DROP NOT NULL;

-- Create HistoricalData table
CREATE TABLE "HistoricalData" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "taskTrackingId" INTEGER NOT NULL,
    "progressTrackerId" INTEGER NOT NULL,
    "taskDuration" INTEGER NOT NULL,
    "scheduleStatus" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricalData_pkey" PRIMARY KEY ("id")
);

-- Foreign key constraints
ALTER TABLE "HistoricalData" ADD CONSTRAINT "HistoricalData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HistoricalData" ADD CONSTRAINT "HistoricalData_progressTrackerId_fkey" FOREIGN KEY ("progressTrackerId") REFERENCES "ProgressTracker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HistoricalData" ADD CONSTRAINT "HistoricalData_taskTrackingId_fkey" FOREIGN KEY ("taskTrackingId") REFERENCES "TaskTracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
