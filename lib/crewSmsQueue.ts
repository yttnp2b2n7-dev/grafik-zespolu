"use client";

import {
  AUTO_SMS_DELAY_MS,
  buildAddedSmsText,
  buildRemovedSmsText,
  isWithinAutoSmsWindow,
} from "@/lib/crewSms";

// Module-level store so any schedule view (grid, day list, event page) can
// queue a message and the single <CrewSmsQueueBar /> shows what is pending.
// Lives only in the open tab: closing the page drops pending messages, which
// the bar warns about via beforeunload.

export type PendingCrewSms = {
  id: string;
  kind: "add" | "remove";
  eventId: string;
  personId: string;
  personName: string;
  title: string;
  text: string;
  error: string | null;
};

type EventInfo = { id: string; title: string; startsAt: string; endsAt: string };
type PersonInfo = { id: string; name: string };

let pending: PendingCrewSms[] = [];
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

function emit(next: PendingCrewSms[]) {
  pending = next;
  listeners.forEach((l) => l());
}

export function subscribeCrewSms(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCrewSmsSnapshot(): PendingCrewSms[] {
  return pending;
}

async function send(item: PendingCrewSms) {
  timers.delete(item.id);
  try {
    const res = await fetch("/api/people/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personIds: [item.personId], text: item.text }),
    });
    if (res.ok) {
      emit(pending.filter((p) => p.id !== item.id));
      return;
    }
    const data = await res.json().catch(() => null);
    const message = data?.error ?? "Nie udało się wysłać SMS";
    emit(
      pending.map((p) => (p.id === item.id ? { ...p, error: message } : p))
    );
    // Error entries stay briefly so the manager sees why nothing arrived.
    setTimeout(() => emit(pending.filter((p) => p.id !== item.id)), 8000);
  } catch {
    emit(
      pending.map((p) =>
        p.id === item.id ? { ...p, error: "Brak połączenia z serwerem" } : p
      )
    );
    setTimeout(() => emit(pending.filter((p) => p.id !== item.id)), 8000);
  }
}

export function cancelCrewSms(id: string) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  emit(pending.filter((p) => p.id !== id));
}

// Called on every add/remove of a person on an event. Only changes made
// within the window before the event start produce a message.
export function queueCrewSms(
  kind: "add" | "remove",
  event: EventInfo,
  person: PersonInfo
) {
  if (!isWithinAutoSmsWindow(event.startsAt)) return;

  // Add then remove (or remove then re-add) inside the grace period: the
  // person never learned of the first change, so neither message goes out.
  const opposite = pending.find(
    (p) =>
      p.eventId === event.id &&
      p.personId === person.id &&
      p.kind !== kind
  );
  if (opposite) {
    cancelCrewSms(opposite.id);
    return;
  }

  const id = `${kind}-${event.id}-${person.id}-${Date.now()}`;
  const text =
    kind === "add"
      ? buildAddedSmsText(person.name, event)
      : buildRemovedSmsText(person.name, event);
  const item: PendingCrewSms = {
    id,
    kind,
    eventId: event.id,
    personId: person.id,
    personName: person.name,
    title: event.title,
    text,
    error: null,
  };
  emit([...pending, item]);
  timers.set(
    id,
    setTimeout(() => send(item), AUTO_SMS_DELAY_MS)
  );
}
