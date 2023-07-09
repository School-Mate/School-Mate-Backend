/*
  Warnings:

  - You are about to drop the column `verifyImageId` on the `UserSchool` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserSchool" DROP CONSTRAINT "UserSchool_verifyImageId_fkey";

-- AlterTable
ALTER TABLE "UserSchool" DROP COLUMN "verifyImageId";
