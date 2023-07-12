/*
  Warnings:

  - Added the required column `dept` to the `UserSchoolVerify` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSchoolVerify" ADD COLUMN     "dept" TEXT NOT NULL;
