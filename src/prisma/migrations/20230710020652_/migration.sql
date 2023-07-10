/*
  Warnings:

  - A unique constraint covering the columns `[schoolId]` on the table `School` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "School_schoolId_key" ON "School"("schoolId");
