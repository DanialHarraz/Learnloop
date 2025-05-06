/*
  Warnings:

  - Added the required column `pollCloseTime` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "pollCloseTime" TIMESTAMP(3) NOT NULL;
