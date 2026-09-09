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
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_LETTERS,
  EVENT_TYPE_OPTIONS,
  type EventType,
} from "@/lib/eventType";

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

function findPreviousDayEvent(event: Event, events: Event[]): Event | null {
  if (!event.groupId) return null;
  const siblings = events
    .filter((e) => e.groupId === event.groupId)
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
  const idx = siblings.findIndex((e) => e.id === event.id);
  if (idx <= 0) return null;
  return siblings[idx - 1];
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
  const [personSearch, setPersonSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [historicalOnly, setHistoricalOnly] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [historicalEvents, setHistoricalEvents] = useState<Event[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const isDraggingRef = useRef(false);
  const isSearching = eventSearch.trim().length > 0 || historicalOnly;

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

  const loadUpcomingEvents = useCallback(async () => {
    const data = await fetchJsonOrNull<Event[]>(
      `/api/events?from=${new Date().toISOString()}`
    );
    if (data) setUpcomingEvents(data);
  }, []);

  const loadHistoricalEvents = useCallback(async () => {
    const data = await fetchJsonOrNull<Event[]>(
      `/api/events?to=${new Date().toISOString()}`
    );
    if (data) setHistoricalEvents(data);
  }, []);

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

  useEffect(() => {
    if (!isSearching || historicalOnly) return;
    setUpcomingLoading(true);
    loadUpcomingEvents().finally(() => setUpcomingLoading(false));
    const interval = setInterval(loadUpcomingEvents, 5000);
    return () => clearInterval(interval);
  }, [isSearching, historicalOnly, loadUpcomingEvents]);

  useEffect(() => {
    if (!historicalOnly) return;
    setHistoricalLoading(true);
    loadHistoricalEvents().finally(() => setHistoricalLoading(false));
    const interval = setInterval(loadHistoricalEvents, 5000);
    return () => clearInterval(interval);
  }, [historicalOnly, loadHistoricalEvents]);

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

  async function copyCrewFromPreviousDay(eventId: string) {
    const event = events.find((ev) => ev.id === eventId);
    const previous = event ? findPreviousDayEvent(event, events) : null;
    if (!event || !previous) return;

    const toRemove = event.assignments;
    const personIds = previous.assignments.map((a) => a.personId);

    await Promise.all(
      toRemove.map((a) => fetch(`/api/assignments/${a.id}`, { method: "DELETE" }))
    );
    const created = await Promise.all(
      personIds.map((personId) =>
        fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, personId }),
        }).then((res) => res.json() as Promise<Assignment>)
      )
    );

    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, assignments: created } : ev))
    );
  }

  async function toggleLead(assignmentId: string, isLead: boolean) {
    const eventId = events.find((ev) =>
      ev.assignments.some((a) => a.id === assignmentId)
    )?.id;

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id !== eventId
          ? ev
          : {
              ...ev,
              assignments: ev.assignments.map((a) => ({
                ...a,
                isLead: a.id === assignmentId ? isLead : isLead ? false : a.isLead,
              })),
            }
      )
    );

    await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLead }),
    });
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
    eventTypes: EventType[];
    notes: string | null;
    loadingEnabled: boolean;
    loadingTime: string | null;
    transportEnabled: boolean;
    transportVehicle: string | null;
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
      eventTypes: EventType[];
      loadingEnabled: boolean;
      loadingTime: string | null;
      transportEnabled: boolean;
      transportVehicle: string | null;
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

  const personSearchQuery = personSearch.trim().toLowerCase();
  const filteredPeople = people.filter(
    (person) =>
      person.name.toLowerCase().includes(personSearchQuery) ||
      person.skills.some((s) =>
        s.skill.name.toLowerCase().includes(personSearchQuery)
      )
  );

  const eventSearchQuery = eventSearch.trim().toLowerCase();
  const searchSource = historicalOnly ? historicalEvents : upcomingEvents;
  const searchLoading = historicalOnly ? historicalLoading : upcomingLoading;
  const searchResults = isSearching
    ? searchSource.filter(
        (ev) =>
          ev.title.toLowerCase().includes(eventSearchQuery) ||
          ev.assignments.some((a) =>
            a.person.name.toLowerCase().includes(eventSearchQuery)
          )
      )
    : [];

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
        <div className="relative">
          <input
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            placeholder="Szukaj wydarzenia po nazwie lub osobie…"
            className="w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {eventSearch.length > 0 && (
            <button
              onClick={() => setEventSearch("")}
              aria-label="Wyczyść wyszukiwanie"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={historicalOnly}
            onChange={(e) => setHistoricalOnly(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border-subtle accent-accent"
          />
          Pokaż tylko historyczne
        </label>

        {isSearching ? (
          <div className="mt-6 flex flex-col gap-3">
            {searchLoading && searchSource.length === 0 && (
              <p className="text-sm text-muted">Ładowanie…</p>
            )}
            {!searchLoading && searchResults.length === 0 && (
              <p className="text-sm text-muted">
                {historicalOnly
                  ? "Brak historycznych wydarzeń pasujących do wyszukiwania."
                  : "Brak nadchodzących wydarzeń pasujących do wyszukiwania."}
              </p>
            )}
            {searchResults.map((event) => (
              <div key={event.id} className="max-w-sm">
                <p className="mb-1 text-xs text-muted">
                  {format(new Date(event.startsAt), "EEEE, d MMMM yyyy", {
                    locale: pl,
                  })}
                </p>
                <EventCard
                  event={event}
                  onRemoveAssignment={removeAssignment}
                  onToggleLead={toggleLead}
                  onDelete={() => deleteEvent(event.id)}
                  onEdit={() => setEditingEvent(event)}
                  readOnly={!isAdmin}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
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
              <input
                value={personSearch}
                onChange={(e) => setPersonSearch(e.target.value)}
                placeholder="Szukaj po imieniu lub umiejętności…"
                className="mb-2 w-full rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <div className="flex flex-col gap-1.5">
                {filteredPeople.map((person) => (
                  <PersonTile key={person.id} person={person} />
                ))}
                {people.length === 0 && (
                  <p className="px-1 text-xs text-muted">
                    Dodaj osoby w zakładce „Ludzie”.
                  </p>
                )}
                {people.length > 0 && filteredPeople.length === 0 && (
                  <p className="px-1 text-xs text-muted">
                    Brak osób pasujących do wyszukiwania.
                  </p>
                )}
              </div>
            </aside>
          )}

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-4 rounded-lg border border-border-subtle bg-surface/50 px-3 py-2">
              {EVENT_TYPE_OPTIONS.map((type) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-black leading-none text-white"
                    style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
                  >
                    {EVENT_TYPE_LETTERS[type]}
                  </span>
                  <span className="text-xs text-muted">
                    {EVENT_TYPE_LABELS[type]}
                  </span>
                </div>
              ))}
            </div>
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
                row.map(({ event, col }) => {
                  const previousDayEvent = findPreviousDayEvent(event, events);
                  return (
                    <div
                      key={event.id}
                      style={{ gridColumn: col + 1, gridRow: rowIdx + 2 }}
                    >
                      <EventCard
                        event={event}
                        onRemoveAssignment={removeAssignment}
                        onToggleLead={toggleLead}
                        onDelete={() => deleteEvent(event.id)}
                        onEdit={() => setEditingEvent(event)}
                        onCopyFromPreviousDay={
                          previousDayEvent
                            ? () => copyCrewFromPreviousDay(event.id)
                            : undefined
                        }
                        readOnly={!isAdmin}
                      />
                    </div>
                  );
                })
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
                      onToggleLead={toggleLead}
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
        </div>
        {loading && <p className="mt-4 text-xs text-muted">Ładowanie…</p>}
          </>
        )}
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
