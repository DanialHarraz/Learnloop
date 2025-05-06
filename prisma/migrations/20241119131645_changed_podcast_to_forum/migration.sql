/*
  Warnings:

  - You are about to drop the column `podcastId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the `Podcast` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `forumId` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_podcastId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "podcastId",
ADD COLUMN     "forumId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Podcast";

-- CreateTable
CREATE TABLE "Forum" (
    "forumId" SERIAL NOT NULL,
    "forumName" TEXT NOT NULL,
    "forumTopic" TEXT NOT NULL,

    CONSTRAINT "Forum_pkey" PRIMARY KEY ("forumId")
);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("forumId") ON DELETE RESTRICT ON UPDATE CASCADE;
