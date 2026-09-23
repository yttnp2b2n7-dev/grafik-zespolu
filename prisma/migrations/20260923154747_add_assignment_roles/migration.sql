-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "roles" "EventType"[] DEFAULT ARRAY[]::"EventType"[];
