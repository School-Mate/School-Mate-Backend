/*
  Warnings:

  - A unique constraint covering the columns `[imageId]` on the table `UserVerify` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserVerify_imageId_key" ON "UserVerify"("imageId");
