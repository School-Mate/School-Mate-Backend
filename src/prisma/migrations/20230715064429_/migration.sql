/*
  Warnings:

  - Added the required column `schoolName` to the `BoardRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BoardRequest" ADD COLUMN     "schoolName" TEXT NOT NULL;
