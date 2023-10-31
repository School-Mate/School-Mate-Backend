/*
  Warnings:

  - You are about to drop the column `DeletedAt` on the `DeletedArticle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DeletedArticle" DROP COLUMN "DeletedAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
