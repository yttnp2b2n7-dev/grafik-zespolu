import { startOfDay } from "date-fns";
import type { Vehicle, VehicleService } from "./types";

// A vehicle is "in service" on `date` if it falls within any of its
// service-block ranges, compared at the calendar-day level (blocks don't
// carry times) - mirrors `isPersonOnVacationOn`.
export function isVehicleInServiceOn(
  vehicle: Pick<Vehicle, "serviceBlocks">,
  date: Date
): VehicleService | null {
  const day = startOfDay(date).getTime();
  return (
    vehicle.serviceBlocks.find((b) => {
      const start = startOfDay(new Date(b.startDate)).getTime();
      const end = startOfDay(new Date(b.endDate)).getTime();
      return day >= start && day <= end;
    }) ?? null
  );
}
