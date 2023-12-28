/*
  Warnings:

  - Added the required column `transactionAdminId` to the `UserBlock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserBlock" ADD COLUMN     "transactionAdminId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_transactionAdminId_fkey" FOREIGN KEY ("transactionAdminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
