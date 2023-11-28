/*
  Warnings:

  - A unique constraint covering the columns `[articleId]` on the table `HotArticle` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HotArticle_articleId_key" ON "HotArticle"("articleId");
