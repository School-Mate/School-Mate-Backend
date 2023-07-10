/*
  Warnings:

  - You are about to drop the column `reciveAnonymous` on the `AskedUser` table. All the data in the column will be lost.
  - You are about to drop the column `reciveOtherSchool` on the `AskedUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AskedUser" DROP COLUMN "reciveAnonymous",
DROP COLUMN "reciveOtherSchool",
ADD COLUMN     "receiveAnonymous" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "receiveOtherSchool" BOOLEAN NOT NULL DEFAULT false;
