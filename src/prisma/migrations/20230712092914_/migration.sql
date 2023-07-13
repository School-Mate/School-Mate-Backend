-- AlterTable
ALTER TABLE "Like" ADD COLUMN     "articleId" INTEGER,
ADD COLUMN     "commentId" INTEGER,
ADD COLUMN     "recommentId" INTEGER;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_recommentId_fkey" FOREIGN KEY ("recommentId") REFERENCES "ReComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
