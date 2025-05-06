/*
  Warnings:

  - You are about to drop the column `senderId` on the `StudyGroupMessage` table. All the data in the column will be lost.
  - Added the required column `userId` to the `StudyGroupMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StudyGroupMessage" DROP CONSTRAINT "StudyGroupMessage_senderId_fkey";

-- AlterTable
ALTER TABLE "StudyGroupMessage" DROP COLUMN "senderId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "StudyGroupMessage" ADD CONSTRAINT "StudyGroupMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
