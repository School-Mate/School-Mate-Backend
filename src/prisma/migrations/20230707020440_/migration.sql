/*
  Warnings:

  - Changed the type of `provider` on the `SocialLogin` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `provider` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserVerifyProcess" AS ENUM ('pending', 'deny', 'success');

-- CreateEnum
CREATE TYPE "SocialLoginProviderType" AS ENUM ('google', 'kakao');

-- CreateEnum
CREATE TYPE "UserLoginProviderType" AS ENUM ('id', 'social');

-- AlterTable
ALTER TABLE "SocialLogin" DROP COLUMN "provider",
ADD COLUMN     "provider" "SocialLoginProviderType" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "provider",
ADD COLUMN     "provider" "UserLoginProviderType" NOT NULL;

-- CreateTable
CREATE TABLE "UserVerify" (
    "userId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "process" "UserVerifyProcess" NOT NULL DEFAULT 'pending',
    "message" TEXT,

    CONSTRAINT "UserVerify_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "School" (
    "schoolId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("schoolId")
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

-- AddForeignKey
ALTER TABLE "UserVerify" ADD CONSTRAINT "UserVerify_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
