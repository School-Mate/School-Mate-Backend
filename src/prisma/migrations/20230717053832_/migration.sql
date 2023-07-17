/*
  Warnings:

  - Changed the type of `MLSV_FGR` on the `Meal` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Meal" DROP COLUMN "MLSV_FGR",
ADD COLUMN     "MLSV_FGR" INTEGER NOT NULL;
