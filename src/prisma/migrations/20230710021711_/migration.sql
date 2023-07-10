/*
  Warnings:

  - Added the required column `askedId` to the `Asked` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asked" ADD COLUMN     "askedId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AskedUser" ALTER COLUMN "message" DROP NOT NULL;
