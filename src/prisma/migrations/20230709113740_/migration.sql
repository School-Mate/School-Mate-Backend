/*
  Warnings:

  - The `process` column on the `UserSchoolVerify` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Process" AS ENUM ('pending', 'deny', 'success');

-- AlterTable
ALTER TABLE "UserSchoolVerify" DROP COLUMN "process",
ADD COLUMN     "process" "Process" NOT NULL DEFAULT 'pending';

-- DropEnum
DROP TYPE "UserVerifyProcess";

-- CreateTable
CREATE TABLE "AskedUser" (
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "askeds" TEXT[],
    "reciveAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "reciveOtherSchool" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AskedUser_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Asked" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "askedUserId" TEXT NOT NULL,
    "process" "Process" NOT NULL DEFAULT 'pending',
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asked_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AskedUser" ADD CONSTRAINT "AskedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asked" ADD CONSTRAINT "Asked_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
