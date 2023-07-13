-- CreateEnum
CREATE TYPE "ReportProcess" AS ENUM ('pending', 'success');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "process" "ReportProcess" NOT NULL DEFAULT 'pending';
