/*
  Warnings:

  - You are about to drop the `QuizPopular` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuizPopular" DROP CONSTRAINT "QuizPopular_quizId_fkey";

-- DropTable
DROP TABLE "QuizPopular";
