-- CreateTable
CREATE TABLE "ReportBlindArticle" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportBlindArticle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReportBlindArticle" ADD CONSTRAINT "ReportBlindArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportBlindArticle" ADD CONSTRAINT "ReportBlindArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
