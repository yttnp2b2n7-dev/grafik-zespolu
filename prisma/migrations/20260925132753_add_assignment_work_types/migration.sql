-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('OSWIETLENIE', 'MULTIMEDIA', 'DZWIEK', 'SCENOGRAFIA');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "workTypes" "WorkType"[] DEFAULT ARRAY[]::"WorkType"[];
