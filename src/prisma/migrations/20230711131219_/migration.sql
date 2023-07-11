/*
  Warnings:

  - You are about to drop the column `schoolId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "schoolId",
ADD COLUMN     "userSchoolId" TEXT;
