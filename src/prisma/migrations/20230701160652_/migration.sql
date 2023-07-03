/*
  Warnings:

  - You are about to drop the column `recevie` on the `Agreement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Agreement" DROP COLUMN "recevie",
ADD COLUMN     "receive" BOOLEAN NOT NULL DEFAULT false;
