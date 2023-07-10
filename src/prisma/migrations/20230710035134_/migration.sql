/*
  Warnings:

  - Added the required column `isAnonymous` to the `Asked` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asked" ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL;

-- AddForeignKey
ALTER TABLE "Asked" ADD CONSTRAINT "Asked_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
