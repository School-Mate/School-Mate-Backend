-- CreateTable
CREATE TABLE "VerifyPhone" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VerifyPhone_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VerifyPhone" ADD CONSTRAINT "VerifyPhone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
