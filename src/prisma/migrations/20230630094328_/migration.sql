/*
  Warnings:

  - You are about to drop the column `userId` on the `VerifyPhone` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "VerifyPhone" DROP CONSTRAINT "VerifyPhone_userId_fkey";

-- AlterTable
ALTER TABLE "VerifyPhone" DROP COLUMN "userId";
