/*
  Warnings:

  - You are about to drop the column `schoolCode` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `schoolName` on the `School` table. All the data in the column will be lost.
  - Added the required column `code` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defaultName` to the `School` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "School" DROP COLUMN "schoolCode",
DROP COLUMN "schoolName",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "defaultName" TEXT NOT NULL,
ADD COLUMN     "name" TEXT;
