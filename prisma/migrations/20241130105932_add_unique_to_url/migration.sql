/*
  Warnings:

  - You are about to drop the column `sharedWith` on the `Resource` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[url]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "sharedWith",
ALTER COLUMN "downloads" DROP NOT NULL,
ALTER COLUMN "downloads" DROP DEFAULT,
ALTER COLUMN "views" DROP NOT NULL,
ALTER COLUMN "views" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Resource_url_key" ON "Resource"("url");
