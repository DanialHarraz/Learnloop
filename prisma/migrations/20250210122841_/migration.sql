/*
  Warnings:

  - A unique constraint covering the columns `[userId,partnerId]` on the table `AccountabilityPartner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `AccountabilityPartner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AccountabilityPartner" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "productive" SET DEFAULT 'no productive';

-- CreateTable
CREATE TABLE "QuizPopular" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizPopular_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountabilityPartner_userId_partnerId_key" ON "AccountabilityPartner"("userId", "partnerId");

-- AddForeignKey
ALTER TABLE "QuizPopular" ADD CONSTRAINT "QuizPopular_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
