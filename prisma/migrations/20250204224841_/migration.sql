/*
  Warnings:

  - You are about to drop the column `productivity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `QuizPopular` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuizPopular" DROP CONSTRAINT "QuizPopular_quizId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "productivity";

-- DropTable
DROP TABLE "QuizPopular";
