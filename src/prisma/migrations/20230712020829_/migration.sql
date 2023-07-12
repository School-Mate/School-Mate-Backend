-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('user', 'article', 'comment');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reportUserId" TEXT NOT NULL,
    "targerId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
