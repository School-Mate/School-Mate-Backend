-- DropForeignKey
ALTER TABLE "Agreement" DROP CONSTRAINT "Agreement_userId_fkey";

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_userId_fkey";

-- DropForeignKey
ALTER TABLE "ArticleLike" DROP CONSTRAINT "ArticleLike_articleId_fkey";

-- DropForeignKey
ALTER TABLE "ArticleLike" DROP CONSTRAINT "ArticleLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "Asked" DROP CONSTRAINT "Asked_askedUserId_fkey";

-- DropForeignKey
ALTER TABLE "Asked" DROP CONSTRAINT "Asked_userId_fkey";

-- DropForeignKey
ALTER TABLE "AskedUser" DROP CONSTRAINT "AskedUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "BoardManager" DROP CONSTRAINT "BoardManager_userId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_articleId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_commentId_fkey";

-- DropForeignKey
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_userId_fkey";

-- DropForeignKey
ALTER TABLE "PushDevice" DROP CONSTRAINT "PushDevice_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReComment" DROP CONSTRAINT "ReComment_articleId_fkey";

-- DropForeignKey
ALTER TABLE "ReComment" DROP CONSTRAINT "ReComment_commentId_fkey";

-- DropForeignKey
ALTER TABLE "ReComment" DROP CONSTRAINT "ReComment_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReCommentLike" DROP CONSTRAINT "ReCommentLike_recommentId_fkey";

-- DropForeignKey
ALTER TABLE "ReCommentLike" DROP CONSTRAINT "ReCommentLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "SocialLogin" DROP CONSTRAINT "SocialLogin_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSchool" DROP CONSTRAINT "UserSchool_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "UserSchoolVerify" DROP CONSTRAINT "UserSchoolVerify_imageId_fkey";

-- DropForeignKey
ALTER TABLE "UserSchoolVerify" DROP CONSTRAINT "UserSchoolVerify_userId_fkey";

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialLogin" ADD CONSTRAINT "SocialLogin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchoolVerify" ADD CONSTRAINT "UserSchoolVerify_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchoolVerify" ADD CONSTRAINT "UserSchoolVerify_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchool" ADD CONSTRAINT "UserSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("schoolId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AskedUser" ADD CONSTRAINT "AskedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asked" ADD CONSTRAINT "Asked_askedUserId_fkey" FOREIGN KEY ("askedUserId") REFERENCES "AskedUser"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asked" ADD CONSTRAINT "Asked_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardManager" ADD CONSTRAINT "BoardManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReComment" ADD CONSTRAINT "ReComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReComment" ADD CONSTRAINT "ReComment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReComment" ADD CONSTRAINT "ReComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReCommentLike" ADD CONSTRAINT "ReCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReCommentLike" ADD CONSTRAINT "ReCommentLike_recommentId_fkey" FOREIGN KEY ("recommentId") REFERENCES "ReComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
