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
  const shifts: PersonShift[] = [];

  for (const e of events) {
    if (!e.assignments.some((a) => a.person.id === personId)) continue;

    if (e.days.length > 0) {
      for (const d of e.days) {
        const start = new Date(d.startsAt);
        const end = new Date(d.endsAt);
        shifts.push({
          key: d.id,
          eventId: e.id,
          title: e.title,
          start,
          end,
          minutes: Math.round((end.getTime() - start.getTime()) / 60000),
        });
      }
    } else {
      const start = new Date(e.startsAt);
      const end = new Date(e.endsAt);
      shifts.push({
        key: e.id,
        eventId: e.id,
        title: e.title,
        start,
        end,
        minutes: Math.round((end.getTime() - start.getTime()) / 60000),
      });
    }
  }

  return shifts.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function totalMinutes(shifts: PersonShift[]): number {
  return shifts.reduce((sum, s) => sum + s.minutes, 0);
}

export function formatMinutesAsHours(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} godz.` : `${h} godz. ${m} min`;
}
