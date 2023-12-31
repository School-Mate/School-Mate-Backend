/*
  Warnings:

  - You are about to drop the column `fllowerCount` on the `ConnectionAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConnectionAccount" DROP COLUMN "fllowerCount",
ADD COLUMN     "followerCount" INTEGER NOT NULL DEFAULT 0;
