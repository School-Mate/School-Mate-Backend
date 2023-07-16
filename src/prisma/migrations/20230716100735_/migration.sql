/*
  Warnings:

  - You are about to drop the column `defalut` on the `Board` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Board" DROP COLUMN "defalut",
ADD COLUMN     "default" BOOLEAN NOT NULL DEFAULT false;
