import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";

export type PersonShift = {
  key: string;
  eventId: string;
  title: string;
  start: Date;
  end: Date;
  minutes: number;
};

export function computePersonShifts(
  events: Event[],
  personId: string
): PersonShift[] {
  return events
    .filter((e) => e.assignments.some((a) => a.person.id === personId))
    .map((e) => {
      const start = new Date(e.startsAt);
      const end = new Date(e.endsAt);
      return {
        key: e.id,
        eventId: e.id,
        title: e.title,
        start,
        end,
        minutes: Math.round((end.getTime() - start.getTime()) / 60000),
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type MonthGroup = {
  key: string;
  label: string;
  shifts: PersonShift[];
};

// Splits a person's shifts into one group per calendar month, so a yearly
// report can show a subtotal after each month (12 of them for a full year).
export function groupShiftsByMonth(shifts: PersonShift[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const shift of shifts) {
    const key = format(shift.start, "yyyy-MM");
    let group = map.get(key);
    if (!group) {
      const rawLabel = format(shift.start, "LLLL yyyy", { locale: pl });
      group = {
        key,
        label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
        shifts: [],
      };
      map.set(key, group);
    }
    group.shifts.push(shift);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function totalMinutes(shifts: PersonShift[]): number {
  return shifts.reduce((sum, s) => sum + s.minutes, 0);
}

export function formatMinutesAsHours(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} godz.` : `${h} godz. ${m} min`;
}
