/*
  Warnings:

  - You are about to drop the column `dept` on the `UserSchoolVerify` table. All the data in the column will be lost.
  - Added the required column `schoolName` to the `UserSchoolVerify` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `UserSchoolVerify` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSchoolVerify" DROP COLUMN "dept",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "schoolName" TEXT NOT NULL,
ADD COLUMN     "userName" TEXT NOT NULL;
