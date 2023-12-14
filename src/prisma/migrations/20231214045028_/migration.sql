-- CreateTable
CREATE TABLE "ReportBlindUser" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportBlindUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReportBlindUser" ADD CONSTRAINT "ReportBlindUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
