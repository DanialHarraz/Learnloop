/*
  Warnings:

  - You are about to drop the column `content` on the `Submission` table. All the data in the column will be lost.
  - Added the required column `fileSubmitted` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "content",
ADD COLUMN     "fileSubmitted" TEXT NOT NULL;
