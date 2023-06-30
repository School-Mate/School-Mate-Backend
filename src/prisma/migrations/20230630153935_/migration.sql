-- CreateTable
CREATE TABLE "SchoolVerifyImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolVerifyImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SchoolVerifyImage" ADD CONSTRAINT "SchoolVerifyImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
