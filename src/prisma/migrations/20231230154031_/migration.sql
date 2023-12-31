-- CreateEnum
CREATE TYPE "FightAreaType" AS ENUM ('school', 'all', 'city', 'district');

-- CreateTable
CREATE TABLE "ConnectionAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "provider" TEXT NOT NULL,
    "fllowerCount" INTEGER NOT NULL DEFAULT 0,
    "articleCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConnectionAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),
    "needTo" TEXT[],
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prize" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "fightAreaType" "FightAreaType" NOT NULL,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConnectionAccount" ADD CONSTRAINT "ConnectionAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
