-- CreateTable
CREATE TABLE "DefaultBoard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "DefaultBoard_pkey" PRIMARY KEY ("id")
);
