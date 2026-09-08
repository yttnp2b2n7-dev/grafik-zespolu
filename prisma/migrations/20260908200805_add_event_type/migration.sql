-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MONTAZ', 'OBSLUGA', 'DEMONTAZ');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "eventType" "EventType";
