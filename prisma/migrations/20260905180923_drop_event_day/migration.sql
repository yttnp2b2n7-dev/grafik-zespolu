-- DropForeignKey
ALTER TABLE "EventDay" DROP CONSTRAINT IF EXISTS "EventDay_eventId_fkey";

-- DropTable
DROP TABLE "EventDay";
