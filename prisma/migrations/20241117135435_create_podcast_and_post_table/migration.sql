-- CreateTable
CREATE TABLE "Podcast" (
    "podcastId" SERIAL NOT NULL,
    "podcastName" TEXT NOT NULL,
    "podcastTopic" TEXT NOT NULL,

    CONSTRAINT "Podcast_pkey" PRIMARY KEY ("podcastId")
);

-- CreateTable
CREATE TABLE "Post" (
    "postId" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "podcastId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("postId")
);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("podcastId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
