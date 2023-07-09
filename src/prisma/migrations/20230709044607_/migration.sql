-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "flags" INTEGER NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_loginId_key" ON "Admin"("loginId");
