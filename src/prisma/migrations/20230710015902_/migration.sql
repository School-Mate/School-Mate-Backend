/*
  Warnings:

  - You are about to drop the column `schoolCode` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `schoolName` on the `School` table. All the data in the column will be lost.
  - Added the required column `code` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defaultName` to the `School` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BoardRequestProcess" AS ENUM ('pending', 'deny', 'success');

-- AlterTable
ALTER TABLE "School" DROP COLUMN "schoolCode",
DROP COLUMN "schoolName",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "defaultName" TEXT NOT NULL,
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "Board" (
    "id" SERIAL NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "noticeId" INTEGER,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardManager" (
    "id" TEXT NOT NULL,
    "boardId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BoardManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "isAnonymous" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boardId" INTEGER NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "process" "BoardRequestProcess" NOT NULL DEFAULT 'pending',
    "message" TEXT,

    CONSTRAINT "BoardRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BoardManager" ADD CONSTRAINT "BoardManager_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardManager" ADD CONSTRAINT "BoardManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
