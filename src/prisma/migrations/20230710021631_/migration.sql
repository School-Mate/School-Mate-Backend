/*
  Warnings:

  - Added the required column `atptOfcdc` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kndsc` to the `School` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "School" ADD COLUMN     "atptOfcdc" TEXT NOT NULL,
ADD COLUMN     "kndsc" TEXT NOT NULL;
