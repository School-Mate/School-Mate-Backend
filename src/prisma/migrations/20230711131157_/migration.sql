/*
  Warnings:

  - You are about to drop the column `userSchoolId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "userSchoolId",
ADD COLUMN     "schoolId" TEXT;
