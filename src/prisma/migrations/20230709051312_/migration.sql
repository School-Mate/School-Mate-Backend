/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the `UserVerify` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserVerify" DROP CONSTRAINT "UserVerify_imageId_fkey";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userSchoolId" TEXT;

-- DropTable
DROP TABLE "UserVerify";

-- CreateTable
CREATE TABLE "UserSchoolVerify" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "message" TEXT,
    "process" "UserVerifyProcess" NOT NULL DEFAULT 'pending',

    CONSTRAINT "UserSchoolVerify_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSchool" (
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "verifyImageId" TEXT,

    CONSTRAINT "UserSchool_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserSchoolVerify" ADD CONSTRAINT "UserSchoolVerify_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchoolVerify" ADD CONSTRAINT "UserSchoolVerify_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchool" ADD CONSTRAINT "UserSchool_verifyImageId_fkey" FOREIGN KEY ("verifyImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchool" ADD CONSTRAINT "UserSchool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchool" ADD CONSTRAINT "UserSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;
