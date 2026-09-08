-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Event_groupId_idx" ON "Event"("groupId");
