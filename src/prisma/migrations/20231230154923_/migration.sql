-- CreateTable
CREATE TABLE "FightRanking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "FightRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FightRankingUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "fightRankingId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FightRankingUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FightRanking" ADD CONSTRAINT "FightRanking_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightRanking" ADD CONSTRAINT "FightRanking_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightRankingUser" ADD CONSTRAINT "FightRankingUser_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightRankingUser" ADD CONSTRAINT "FightRankingUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightRankingUser" ADD CONSTRAINT "FightRankingUser_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightRankingUser" ADD CONSTRAINT "FightRankingUser_fightRankingId_fkey" FOREIGN KEY ("fightRankingId") REFERENCES "FightRanking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
