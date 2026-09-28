import { differenceInCalendarDays, startOfDay } from "date-fns";

export type ExpiryStatus = "expired" | "soon" | "ok";

const WARNING_DAYS = 30;

// Vehicle documents (przegląd/ubezpieczenie) warn starting `WARNING_DAYS`
// before they lapse, and flag outright once the date has passed.
export function getExpiryStatus(date: string | null): ExpiryStatus | null {
  if (!date) return null;
  const days = differenceInCalendarDays(startOfDay(new Date(date)), startOfDay(new Date()));
  if (days < 0) return "expired";
  if (days <= WARNING_DAYS) return "soon";
  return "ok";
}
