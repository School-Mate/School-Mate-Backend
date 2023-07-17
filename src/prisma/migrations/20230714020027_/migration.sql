/*
  Warnings:

  - The values [deny] on the enum `BoardRequestProcess` will be removed. If these variants are still used in the database, this will fail.
  - The values [deny] on the enum `Process` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BoardRequestProcess_new" AS ENUM ('pending', 'denied', 'success');
ALTER TABLE "BoardRequest" ALTER COLUMN "process" DROP DEFAULT;
ALTER TABLE "BoardRequest" ALTER COLUMN "process" TYPE "BoardRequestProcess_new" USING ("process"::text::"BoardRequestProcess_new");
ALTER TYPE "BoardRequestProcess" RENAME TO "BoardRequestProcess_old";
ALTER TYPE "BoardRequestProcess_new" RENAME TO "BoardRequestProcess";
DROP TYPE "BoardRequestProcess_old";
ALTER TABLE "BoardRequest" ALTER COLUMN "process" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Process_new" AS ENUM ('pending', 'denied', 'success');
ALTER TABLE "Asked" ALTER COLUMN "process" DROP DEFAULT;
ALTER TABLE "UserSchoolVerify" ALTER COLUMN "process" DROP DEFAULT;
ALTER TABLE "UserSchoolVerify" ALTER COLUMN "process" TYPE "Process_new" USING ("process"::text::"Process_new");
ALTER TABLE "Asked" ALTER COLUMN "process" TYPE "Process_new" USING ("process"::text::"Process_new");
ALTER TYPE "Process" RENAME TO "Process_old";
ALTER TYPE "Process_new" RENAME TO "Process";
DROP TYPE "Process_old";
ALTER TABLE "Asked" ALTER COLUMN "process" SET DEFAULT 'pending';
ALTER TABLE "UserSchoolVerify" ALTER COLUMN "process" SET DEFAULT 'pending';
COMMIT;
