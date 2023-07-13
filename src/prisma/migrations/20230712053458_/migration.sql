-- CreateEnum
CREATE TYPE "LikeType" AS ENUM ('like', 'dislike');

-- CreateEnum
CREATE TYPE "LikeTargetType" AS ENUM ('article', 'comment');

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" "LikeTargetType" NOT NULL,
    "likeType" "LikeType" NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
