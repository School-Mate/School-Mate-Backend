-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;
