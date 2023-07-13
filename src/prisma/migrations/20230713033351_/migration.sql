/*
  Warnings:

  - Added the required column `schoolId` to the `BoardRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BoardRequest" ADD COLUMN     "schoolId" TEXT NOT NULL;
