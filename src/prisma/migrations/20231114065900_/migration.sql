-- CreateEnum
CREATE TYPE "LikeType" AS ENUM ('like', 'dislike');

-- CreateEnum
CREATE TYPE "Process" AS ENUM ('pending', 'denied', 'success');

-- CreateEnum
CREATE TYPE "SocialLoginProviderType" AS ENUM ('google', 'kakao');

-- CreateEnum
CREATE TYPE "UserLoginProviderType" AS ENUM ('id', 'social');

-- CreateEnum
CREATE TYPE "BoardRequestProcess" AS ENUM ('pending', 'denied', 'success');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('user', 'article', 'comment', 'asked', 'recomment');

-- CreateEnum
CREATE TYPE "ReportProcess" AS ENUM ('pending', 'success');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "profile" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" "UserLoginProviderType" NOT NULL,
    "userSchoolId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "schoolId" TEXT NOT NULL,
    "org" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "atptCode" TEXT NOT NULL,
    "defaultName" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("schoolId")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneVerifyRequest" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "PhoneVerifyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLogin" (
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "userId" TEXT NOT NULL,
    "socialId" TEXT NOT NULL,
    "provider" "SocialLoginProviderType" NOT NULL,

    CONSTRAINT "SocialLogin_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "receive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserSchoolVerify" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "message" TEXT,
    "process" "Process" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolName" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "dept" TEXT NOT NULL,

    CONSTRAINT "UserSchoolVerify_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSchool" (
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "class" TEXT NOT NULL,

    CONSTRAINT "UserSchool_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "BusStation" (
    "busStationId" TEXT NOT NULL,
    "busStationName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BusStation_pkey" PRIMARY KEY ("busStationId")
);

-- CreateTable
CREATE TABLE "BusRoute" (
    "busRouteId" TEXT NOT NULL,
    "busRouteNum" TEXT NOT NULL,
    "busRouteTp" TEXT NOT NULL,
    "endNodeName" TEXT NOT NULL,
    "startNodeName" TEXT NOT NULL,
    "endVehicleTime" TEXT NOT NULL,
    "startVehicleTime" TEXT NOT NULL,
    "intervalTime" TEXT NOT NULL,
    "intervalSatTime" TEXT NOT NULL,
    "intervalSunTime" TEXT NOT NULL,

    CONSTRAINT "BusRoute_pkey" PRIMARY KEY ("busRouteId")
);

-- CreateTable
CREATE TABLE "BusArrival" (
    "busStationId" TEXT NOT NULL,
    "busStationName" TEXT NOT NULL,
    "busRouteNum" TEXT NOT NULL,
    "busRouteTp" TEXT NOT NULL,
    "arrprevStationCnt" TEXT NOT NULL,
    "arrTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusArrival_pkey" PRIMARY KEY ("busStationId")
);

-- CreateTable
CREATE TABLE "AskedUser" (
    "userId" TEXT NOT NULL,
    "customId" TEXT,
    "statusMessage" TEXT,
    "image" TEXT,
    "tags" TEXT[],
    "receiveAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "receiveOtherSchool" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdateCustomId" TIMESTAMP(3),

    CONSTRAINT "AskedUser_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Asked" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "askedUserId" TEXT NOT NULL,
    "process" "Process" NOT NULL DEFAULT 'pending',
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answerTimeAt" TIMESTAMP(3),
    "isAnonymous" BOOLEAN NOT NULL,

    CONSTRAINT "Asked_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "flags" INTEGER NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" SERIAL NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "noticeId" INTEGER[],

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardManager" (
    "id" TEXT NOT NULL,
    "boardId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BoardManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "isAnonymous" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boardId" INTEGER NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaultBoard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "DefaultBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletedArticle" (
    "id" INTEGER NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "isAnonymous" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boardId" INTEGER NOT NULL,

    CONSTRAINT "DeletedArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "process" "BoardRequestProcess" NOT NULL DEFAULT 'pending',
    "message" TEXT,

    CONSTRAINT "BoardRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReComment" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commentId" INTEGER,

    CONSTRAINT "ReComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reportUserId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "message" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reportUserName" TEXT NOT NULL,
    "process" "ReportProcess" NOT NULL DEFAULT 'pending',

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleLike" (
    "id" TEXT NOT NULL,
    "articleId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "likeType" "LikeType" NOT NULL,

    CONSTRAINT "ArticleLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "commentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "likeType" "LikeType" NOT NULL,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReCommentLike" (
    "id" TEXT NOT NULL,
    "recommentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "likeType" "LikeType" NOT NULL,

    CONSTRAINT "ReCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "MLSV_FGR" INTEGER NOT NULL,
    "DDISH_NM" TEXT NOT NULL,
    "ORPLC_INFO" TEXT NOT NULL,
    "CAL_INFO" TEXT NOT NULL,
    "NTR_INFO" TEXT NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolId_key" ON "School"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLogin_socialId_key" ON "SocialLogin"("socialId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_loginId_key" ON "Admin"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_id_key" ON "Meal"("id");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialLogin" ADD CONSTRAINT "SocialLogin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchoolVerify" ADD CONSTRAINT "UserSchoolVerify_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchoolVerify" ADD CONSTRAINT "UserSchoolVerify_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchool" ADD CONSTRAINT "UserSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchool" ADD CONSTRAINT "UserSchool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AskedUser" ADD CONSTRAINT "AskedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asked" ADD CONSTRAINT "Asked_askedUserId_fkey" FOREIGN KEY ("askedUserId") REFERENCES "AskedUser"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asked" ADD CONSTRAINT "Asked_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardManager" ADD CONSTRAINT "BoardManager_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardManager" ADD CONSTRAINT "BoardManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReComment" ADD CONSTRAINT "ReComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReComment" ADD CONSTRAINT "ReComment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReComment" ADD CONSTRAINT "ReComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReCommentLike" ADD CONSTRAINT "ReCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReCommentLike" ADD CONSTRAINT "ReCommentLike_recommentId_fkey" FOREIGN KEY ("recommentId") REFERENCES "ReComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
