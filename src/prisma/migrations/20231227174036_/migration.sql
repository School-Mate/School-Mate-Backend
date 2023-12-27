-- CreateTable
CREATE TABLE "DeletedComment" (
    "id" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL,
    "isDeleted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "articleId" INTEGER NOT NULL,

    CONSTRAINT "DeletedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletedReComment" (
    "id" INTEGER NOT NULL,
    "articleId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL,
    "isDeleted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commentId" INTEGER,

    CONSTRAINT "DeletedReComment_pkey" PRIMARY KEY ("id")
);
