/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `AskedUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AskedUser_userId_key" ON "AskedUser"("userId");
