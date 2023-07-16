/*
  Warnings:

  - The `noticeId` column on the `Board` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "defalut" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "noticeId",
ADD COLUMN     "noticeId" INTEGER[];
