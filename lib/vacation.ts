import { startOfDay } from "date-fns";
import type { Person, Vacation } from "./types";

// A person is "on vacation" on `date` if it falls within any of their
// vacation ranges, compared at the calendar-day level (vacations don't
// carry times).
export function isPersonOnVacationOn(
  person: Pick<Person, "vacations">,
  date: Date
): Vacation | null {
  const day = startOfDay(date).getTime();
  return (
    person.vacations.find((v) => {
      const start = startOfDay(new Date(v.startDate)).getTime();
      const end = startOfDay(new Date(v.endDate)).getTime();
      return day >= start && day <= end;
    }) ?? null
  );
}
