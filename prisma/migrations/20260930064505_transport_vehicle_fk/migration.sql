-- AlterTable
ALTER TABLE "Event" DROP COLUMN "transportVehicle",
ADD COLUMN     "transportVehicleId" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_transportVehicleId_fkey" FOREIGN KEY ("transportVehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

