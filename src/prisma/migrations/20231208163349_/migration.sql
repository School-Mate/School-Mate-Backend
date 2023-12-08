-- DropForeignKey
ALTER TABLE "UserSchool" DROP CONSTRAINT "UserSchool_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "UserSchool" DROP CONSTRAINT "UserSchool_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserSchool" ADD CONSTRAINT "UserSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchool" ADD CONSTRAINT "UserSchool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
