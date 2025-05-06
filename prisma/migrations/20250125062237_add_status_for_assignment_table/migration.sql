-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('UPCOMING', 'DUE', 'OVERDUE', 'COMPLETED', 'EXTENDED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'UPCOMING';
