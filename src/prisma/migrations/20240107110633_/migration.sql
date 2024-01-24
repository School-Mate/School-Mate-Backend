-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('share', 'school');

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "boardType" "BoardType" NOT NULL DEFAULT 'school';
