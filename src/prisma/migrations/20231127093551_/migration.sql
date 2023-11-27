/*
  Warnings:

  - Added the required column `schoolId` to the `HotArticle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HotArticle" ADD COLUMN     "schoolId" TEXT NOT NULL;
