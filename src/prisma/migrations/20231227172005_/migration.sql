/*
  Warnings:

  - Added the required column `targetType` to the `UserBlock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserBlock" ADD COLUMN     "targetType" "ReportTargetType" NOT NULL;
