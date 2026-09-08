-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "loadingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loadingTime" TEXT,
ADD COLUMN     "transportEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transportVehicle" TEXT;
