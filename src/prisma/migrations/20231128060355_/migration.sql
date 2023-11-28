-- DropForeignKey
ALTER TABLE "HotArticle" DROP CONSTRAINT "HotArticle_articleId_fkey";

-- AddForeignKey
ALTER TABLE "HotArticle" ADD CONSTRAINT "HotArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
