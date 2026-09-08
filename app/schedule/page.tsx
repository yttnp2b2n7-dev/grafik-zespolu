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
import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  format,
  isSameDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { pl } from "date-fns/locale";
import type { Assignment, Event, Person } from "@/lib/types";
import { PersonTile } from "./PersonTile";
import { EventCard } from "./EventCard";
import { EventModal } from "./EventModal";
import { useSession } from "../session-context";
import { fetchJsonOrNull } from "@/lib/clientFetch";

const DAY_LABELS = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

type GroupItem = { event: Event; col: number };

// Events created together as a multi-day series share a groupId (each day is
// its own independent event so it can have its own assignments), but the
// whole series should still line up on one shared row across the days it
// covers, like a single event would.
function packEventGroups(events: Event[], weekStart: Date): GroupItem[][] {
  const groupsMap = new Map<string, Event[]>();
  for (const event of events) {
    if (!event.groupId) continue;
    const list = groupsMap.get(event.groupId) ?? [];
    list.push(event);
    groupsMap.set(event.groupId, list);
  }

  const groups = [...groupsMap.values()]
    .map((groupEvents) =>
      groupEvents
        .map((event) => ({
          event,
          col: differenceInCalendarDays(new Date(event.startsAt), weekStart),
        }))
        .filter((item) => item.col >= 0 && item.col <= 6)
        .sort((a, b) => a.col - b.col)
    )
    .filter((items) => items.length > 0)
    .sort((a, b) => a[0].col - b[0].col);

  const rows: GroupItem[][] = [];
  const rowRanges: { startCol: number; endCol: number }[] = [];
  for (const items of groups) {
    const startCol = items[0].col;
    const endCol = items[items.length - 1].col;
    const rowIndex = rowRanges.findIndex((r) => r.endCol < startCol);
    if (rowIndex !== -1) {
      rows[rowIndex].push(...items);
      rowRanges[rowIndex].endCol = Math.max(rowRanges[rowIndex].endCol, endCol);
    } else {
      rows.push([...items]);
      rowRanges.push({ startCol, endCol });
    }
  }
  return rows;
}

export default function SchedulePage() {
  const { role } = useSession();
  const isAdmin = role === "admin";
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [draggedPerson, setDraggedPerson] = useState<Person | null>(null);
  const isDraggingRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const loadPeople = useCallback(async () => {
    const data = await fetchJsonOrNull<Person[]>("/api/people");
    if (data) setPeople(data);
  }, []);

  const loadEvents = useCallback(async () => {
    const weekEnd = addDays(weekStart, 7);
    const data = await fetchJsonOrNull<Event[]>(
      `/api/events?weekStart=${weekStart.toISOString()}&weekEnd=${weekEnd.toISOString()}`
    );
    if (data) setEvents(data);
  }, [weekStart]);

  useEffect(() => {
    if (isAdmin) loadPeople();
  }, [isAdmin, loadPeople]);

  useEffect(() => {
    setLoading(true);
    loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDraggingRef.current) return;
      if (isAdmin) loadPeople();
      loadEvents();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAdmin, loadPeople, loadEvents]);

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

    const activeData = active.data.current;
    const personId = activeData?.person?.id as string | undefined;
    const eventId = over.data.current?.eventId as string | undefined;
    if (!personId || !eventId) return;

    const sourceEventId = activeData?.sourceEventId as string | undefined;
    const sourceAssignmentId = activeData?.assignmentId as string | undefined;
    if (sourceEventId && sourceEventId === eventId) return;

    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, personId }),
    });
    if (!res.ok) return;
    const assignment: Assignment = await res.json();

    if (sourceEventId && sourceAssignmentId) {
      await fetch(`/api/assignments/${sourceAssignmentId}`, {
        method: "DELETE",
      });
    }

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === sourceEventId) {
          return {
            ...ev,
            assignments: ev.assignments.filter(
              (a) => a.id !== sourceAssignmentId
            ),
          };
        }
        if (ev.id === eventId) {
          return {
            ...ev,
            assignments: ev.assignments.some((a) => a.id === assignment.id)
              ? ev.assignments
              : [...ev.assignments, assignment],
          };
        }
        return ev;
      })
    );
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
    days?: { startsAt: string; endsAt: string }[];
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

  async function updateEvent(
    eventId: string,
    data: {
      title: string;
      startsAt: string;
      endsAt: string;
      days?: { startsAt: string; endsAt: string }[];
    }
  ) {
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await loadEvents();
    }
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const singleDayEvents = events.filter((ev) => !ev.groupId);
  const groupRows = packEventGroups(events, weekStart);

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
          {isAdmin && (
            <button
              onClick={() => setModalDate(format(weekStart, "yyyy-MM-dd"))}
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              + Dodaj wydarzenie
            </button>
          )}
        </div>

        <div
          className={`mt-6 grid grid-cols-1 gap-6 ${isAdmin ? "lg:grid-cols-[200px_1fr]" : ""}`}
        >
          {isAdmin && (
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
          )}

          <div className="overflow-x-auto">
            <div className="grid min-w-[1050px] grid-cols-7 gap-3">
              {days.map((day, i) => (
                <div
                  key={`header-${i}`}
                  className="px-1"
                  style={{ gridColumn: i + 1, gridRow: 1 }}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {DAY_LABELS[i]}
                  </p>
                  <p className="text-xs text-muted/70">
                    {format(day, "d MMM", { locale: pl })}
                  </p>
                </div>
              ))}

              {groupRows.map((row, rowIdx) =>
                row.map(({ event, col }) => (
                  <div
                    key={event.id}
                    style={{ gridColumn: col + 1, gridRow: rowIdx + 2 }}
                  >
                    <EventCard
                      event={event}
                      onRemoveAssignment={removeAssignment}
                      onDelete={() => deleteEvent(event.id)}
                      onEdit={() => setEditingEvent(event)}
                      readOnly={!isAdmin}
                    />
                  </div>
                ))
              )}

              {days.flatMap((day, i) => {
                const dayEvents = singleDayEvents.filter((ev) =>
                  isSameDay(new Date(ev.startsAt), day)
                );
                let lastGroupRow = -1;
                groupRows.forEach((row, rowIdx) => {
                  if (row.some((item) => item.col === i)) {
                    lastGroupRow = rowIdx;
                  }
                });
                const startRow = lastGroupRow + 3;

                const items = dayEvents.map((ev, evIdx) => (
                  <div
                    key={ev.id}
                    style={{ gridColumn: i + 1, gridRow: startRow + evIdx }}
                  >
                    <EventCard
                      event={ev}
                      onRemoveAssignment={removeAssignment}
                      onDelete={() => deleteEvent(ev.id)}
                      onEdit={() => setEditingEvent(ev)}
                      readOnly={!isAdmin}
                    />
                  </div>
                ));

                if (isAdmin) {
                  items.push(
                    <div
                      key={`add-${i}`}
                      style={{
                        gridColumn: i + 1,
                        gridRow: startRow + dayEvents.length,
                      }}
                    >
                      <button
                        onClick={() => setModalDate(format(day, "yyyy-MM-dd"))}
                        className="w-full rounded-md border border-dashed border-border-subtle py-2 text-xs text-muted/60 transition hover:border-accent/60 hover:text-muted"
                      >
                        + wydarzenie
                      </button>
                    </div>
                  );
                }

                return items;
              })}
            </div>
          </div>
        </div>
        {loading && <p className="mt-4 text-xs text-muted">Ładowanie…</p>}
      </div>

      <DragOverlay>
        {draggedPerson ? <PersonTile person={draggedPerson} dragging /> : null}
      </DragOverlay>

      {isAdmin && modalDate && (
        <EventModal
          defaultDate={modalDate}
          onClose={() => setModalDate(null)}
          onSubmit={createEvent}
        />
      )}

      {isAdmin && editingEvent && (
        <EventModal
          defaultDate={format(new Date(editingEvent.startsAt), "yyyy-MM-dd")}
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSubmit={(data) => updateEvent(editingEvent.id, data)}
        />
      )}
    </DndContext>
  );
}
