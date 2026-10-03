import { format, isSameDay } from "date-fns";

// Automatic SMS only fires for crew changes made shortly before the event.
// Earlier changes are planned in advance and get the usual manual flow.
export const AUTO_SMS_WINDOW_MS = 72 * 60 * 60 * 1000;

// Short grace period so an accidental drag can be cancelled before the
// message leaves. No countdown is shown to the user.
export const AUTO_SMS_DELAY_MS = 60 * 1000;

export function isWithinAutoSmsWindow(startsAt: string, now = Date.now()): boolean {
  const untilStart = new Date(startsAt).getTime() - now;
  return untilStart > 0 && untilStart < AUTO_SMS_WINDOW_MS;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function eventLabel(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return isSameDay(start, end)
    ? `${format(start, "d.MM")} ${format(start, "HH:mm")}-${format(end, "HH:mm")}`
    : `${format(start, "d.MM HH:mm")}-${format(end, "d.MM HH:mm")}`;
}

export function buildAddedSmsText(
  personName: string,
  event: { title: string; startsAt: string; endsAt: string }
): string {
  return `Cześć ${firstName(personName)}! Zostałeś dopisany do ekipy: ${event.title}, ${eventLabel(event.startsAt, event.endsAt)}. Szczegóły w grafiku.`;
}

export function buildRemovedSmsText(
  personName: string,
  event: { title: string; startsAt: string; endsAt: string }
): string {
  return `Cześć ${firstName(personName)}, zostałeś zdjęty z ekipy: ${event.title}, ${eventLabel(event.startsAt, event.endsAt)}. Prosimy o kontakt, jeśli to pomyłka.`;
}
