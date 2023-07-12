/*
  Warnings:

  - You are about to drop the column `targerId` on the `Report` table. All the data in the column will be lost.
  - Added the required column `targetId` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "targerId",
ADD COLUMN     "targetId" TEXT NOT NULL;
