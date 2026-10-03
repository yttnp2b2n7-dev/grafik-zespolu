-- CreateTable
CREATE TABLE "VehicleNote" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "VehicleNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleNote_vehicleId_idx" ON "VehicleNote"("vehicleId");

-- AddForeignKey
ALTER TABLE "VehicleNote" ADD CONSTRAINT "VehicleNote_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

