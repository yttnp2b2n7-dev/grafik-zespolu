-- CreateTable
CREATE TABLE "VehicleService" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleService_vehicleId_idx" ON "VehicleService"("vehicleId");

-- AddForeignKey
ALTER TABLE "VehicleService" ADD CONSTRAINT "VehicleService_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
