"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { addDays, addWeeks, format, isSameDay, startOfWeek, subWeeks } from "date-fns";
import { pl } from "date-fns/locale";
import type { Assignment, Event, Person } from "@/lib/types";
import { PersonTile } from "./PersonTile";
import { EventCard } from "./EventCard";
import { AddEventModal } from "./AddEventModal";

const DAY_LABELS = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [draggedPerson, setDraggedPerson] = useState<Person | null>(null);
  const isDraggingRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const loadPeople = useCallback(async () => {
    const res = await fetch("/api/people");
    setPeople(await res.json());
  }, []);

  const loadEvents = useCallback(async () => {
    const weekEnd = addDays(weekStart, 7);
    const res = await fetch(
      `/api/events?weekStart=${weekStart.toISOString()}&weekEnd=${weekEnd.toISOString()}`
    );
    setEvents(await res.json());
  }, [weekStart]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  useEffect(() => {
    setLoading(true);
    loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDraggingRef.current) return;
      loadPeople();
      loadEvents();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadPeople, loadEvents]);

  function handleDragStart(e: DragStartEvent) {
    isDraggingRef.current = true;
    const person = e.active.data.current?.person as Person | undefined;
    setDraggedPerson(person ?? null);
  }

  async function handleDragEnd(e: DragEndEvent) {
    isDraggingRef.current = false;
    setDraggedPerson(null);
    const { active, over } = e;
    if (!over) return;
    const personId = active.data.current?.person?.id as string | undefined;
    const eventId = over.data.current?.eventId as string | undefined;
    if (!personId || !eventId) return;

    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, personId }),
    });
    if (res.ok) {
      const assignment: Assignment = await res.json();
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId
            ? {
                ...ev,
                assignments: ev.assignments.some((a) => a.id === assignment.id)
                  ? ev.assignments
                  : [...ev.assignments, assignment],
              }
            : ev
        )
      );
    }
  }

  async function removeAssignment(assignmentId: string) {
    setEvents((prev) =>
      prev.map((ev) => ({
        ...ev,
        assignments: ev.assignments.filter((a) => a.id !== assignmentId),
      }))
    );
    await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE" });
  }

  async function deleteEvent(eventId: string) {
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    await fetch(`/api/events/${eventId}`, { method: "DELETE" });
  }

  async function createEvent(data: {
    title: string;
    startsAt: string;
    endsAt: string;
  }) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await loadEvents();
    }
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekStart((d) => subWeeks(d, 1))}
              className="rounded-md border border-border-subtle px-2.5 py-1.5 text-sm text-muted hover:border-accent hover:text-foreground"
              aria-label="Poprzedni tydzień"
            >
              ←
            </button>
            <div className="text-sm text-foreground">
              {format(weekStart, "d MMM", { locale: pl })} –{" "}
              {format(addDays(weekStart, 6), "d MMM yyyy", { locale: pl })}
            </div>
            <button
              onClick={() => setWeekStart((d) => addWeeks(d, 1))}
              className="rounded-md border border-border-subtle px-2.5 py-1.5 text-sm text-muted hover:border-accent hover:text-foreground"
              aria-label="Następny tydzień"
            >
              →
            </button>
            <button
              onClick={() =>
                setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
              }
              className="rounded-md px-2.5 py-1.5 text-xs text-muted hover:text-foreground"
            >
              Dziś
            </button>
          </div>
          <button
            onClick={() => setModalDate(format(weekStart, "yyyy-MM-dd"))}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            + Dodaj wydarzenie
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
          <aside className="h-max rounded-lg border border-border-subtle bg-surface/50 p-3 lg:sticky lg:top-6">
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted">
              Ludzie
            </p>
            <div className="flex flex-col gap-1.5">
              {people.map((person) => (
                <PersonTile key={person.id} person={person} />
              ))}
              {people.length === 0 && (
                <p className="px-1 text-xs text-muted">
                  Dodaj osoby w zakładce „Ludzie”.
                </p>
              )}
            </div>
          </aside>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {days.map((day, i) => (
              <div key={i} className="min-w-0">
                <div className="mb-2 px-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {DAY_LABELS[i]}
                  </p>
                  <p className="text-xs text-muted/70">
                    {format(day, "d MMM", { locale: pl })}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {events
                    .filter((ev) => isSameDay(new Date(ev.startsAt), day))
                    .map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        onRemoveAssignment={removeAssignment}
                        onDelete={() => deleteEvent(ev.id)}
                      />
                    ))}
                  <button
                    onClick={() => setModalDate(format(day, "yyyy-MM-dd"))}
                    className="rounded-md border border-dashed border-border-subtle py-2 text-xs text-muted/60 transition hover:border-accent/60 hover:text-muted"
                  >
                    + wydarzenie
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {loading && <p className="mt-4 text-xs text-muted">Ładowanie…</p>}
      </div>

      <DragOverlay>
        {draggedPerson ? <PersonTile person={draggedPerson} dragging /> : null}
      </DragOverlay>

      {modalDate && (
        <AddEventModal
          defaultDate={modalDate}
          onClose={() => setModalDate(null)}
          onCreate={createEvent}
        />
      )}
    </DndContext>
  );
}
