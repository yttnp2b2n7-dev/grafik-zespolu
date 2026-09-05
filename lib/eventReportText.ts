import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";

export function getEventDateTimeLabel(event: Event) {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const dateLabel = isSameDay(start, end)
    ? format(start, "d MMMM yyyy, EEEE", { locale: pl })
    : `${format(start, "d MMMM yyyy", { locale: pl })} – ${format(end, "d MMMM yyyy", { locale: pl })}`;
  const timeLabel = `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;
  return { dateLabel, timeLabel };
}

export function formatEventReportText(event: Event): string {
  const { dateLabel, timeLabel } = getEventDateTimeLabel(event);
  const people = event.assignments.map((a) => a.person.name).join(", ");

  return [
    event.title,
    `${dateLabel}, ${timeLabel}`,
    `Przypisani: ${people || "brak"}`,
  ].join("\n");
}

export function formatWeekReportText(events: Event[], weekLabel: string): string {
  const header = `Raport tygodnia: ${weekLabel}`;
  if (events.length === 0) {
    return `${header}\n\nBrak wydarzeń w tym tygodniu.`;
  }
  const body = events.map(formatEventReportText).join("\n\n");
  return `${header}\n\n${body}`;
}
