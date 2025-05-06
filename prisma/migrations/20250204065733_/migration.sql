-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "popular" TEXT DEFAULT 'no popular';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "productivity" TEXT DEFAULT 'average productivity';

-- CreateTable
CREATE TABLE "QuizPopular" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizPopular_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuizPopular" ADD CONSTRAINT "QuizPopular_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
