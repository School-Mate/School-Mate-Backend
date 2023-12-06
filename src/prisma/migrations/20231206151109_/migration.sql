/*
  Warnings:

  - Added the required column `views` to the `DeletedArticle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeletedArticle" ADD COLUMN     "views" INTEGER NOT NULL;
