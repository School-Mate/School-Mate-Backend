/*
  Warnings:

  - You are about to drop the column `askedId` on the `Asked` table. All the data in the column will be lost.
  - You are about to drop the column `askeds` on the `AskedUser` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `AskedUser` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Asked" DROP CONSTRAINT "Asked_userId_fkey";

-- AlterTable
ALTER TABLE "Asked" DROP COLUMN "askedId",
ADD COLUMN     "answerTimeAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AskedUser" DROP COLUMN "askeds",
DROP COLUMN "message",
ADD COLUMN     "customId" TEXT,
ADD COLUMN     "statusMessage" TEXT;

-- AddForeignKey
ALTER TABLE "Asked" ADD CONSTRAINT "Asked_askedUserId_fkey" FOREIGN KEY ("askedUserId") REFERENCES "AskedUser"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
