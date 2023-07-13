/*
  Warnings:

  - You are about to drop the column `articleId` on the `Like` table. All the data in the column will be lost.
  - You are about to drop the column `commentId` on the `Like` table. All the data in the column will be lost.
  - You are about to drop the column `recommentId` on the `Like` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_articleId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_recommentId_fkey";

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "articleId",
DROP COLUMN "commentId",
DROP COLUMN "recommentId";
