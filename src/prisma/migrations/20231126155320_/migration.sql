-- CreateTable
CREATE TABLE "HotArticle" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,

    CONSTRAINT "HotArticle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HotArticle" ADD CONSTRAINT "HotArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
