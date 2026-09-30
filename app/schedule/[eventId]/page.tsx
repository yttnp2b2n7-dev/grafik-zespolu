"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, isSameDay, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event, EventTask, Vehicle } from "@/lib/types";
import { fetchJsonOrNull } from "@/lib/clientFetch";
import { usePolling } from "@/lib/usePolling";
import { useUndo } from "@/lib/undo-context";
import { parseLocalDate } from "@/lib/localDate";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_LETTERS,
  type EventType,
} from "@/lib/eventType";
import type { WorkType } from "@/lib/workType";
import { EventAssignedPeopleList } from "../EventAssignedPeopleList";
import { EventSmsFlow } from "../EventSmsFlow";
import { EventModal } from "../EventModal";

export default function EventPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const pushUndo = useUndo();
  const [event, setEvent] = useState<Event | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editing, setEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  // Guards the manager-note textarea against a background poll landing
  // mid-edit and clobbering what the user is typing with the older
  // server value - only synced from the server while untouched locally.
  const noteDirtyRef = useRef(false);

  async function loadEvent() {
    const data = await fetchJsonOrNull<Event>(`/api/events/${params.eventId}`);
    if (data) {
      setEvent(data);
      if (!noteDirtyRef.current) setNoteDraft(data.managerNote ?? "");
    } else {
      setNotFound(true);
    }
  }

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.eventId]);

  usePolling(loadEvent, 15000);

  useEffect(() => {
    fetchJsonOrNull<Vehicle[]>("/api/vehicles").then((data) => {
      if (data) setVehicles(data);
    });
  }, []);

  async function saveManagerNote() {
    if (!event) return;
    setNoteSaving(true);
    await fetch(`/api/events/${event.id}/manager-note`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ managerNote: noteDraft }),
    });
    noteDirtyRef.current = false;
    setNoteSaving(false);
  }

  async function toggleLead(assignmentId: string, isLead: boolean) {
    if (!event) return;
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            assignments: prev.assignments.map((a) => ({
              ...a,
              isLead: a.id === assignmentId ? isLead : isLead ? false : a.isLead,
            })),
          }
        : prev
    );
    await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLead }),
    });
  }

  async function toggleAssignmentRole(
    assignmentId: string,
    type: EventType,
    checked: boolean
  ) {
    if (!event) return;
    const assignment = event.assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;
    const nextRoles = checked
      ? [...assignment.roles, type]
      : assignment.roles.filter((r) => r !== type);
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            assignments: prev.assignments.map((a) =>
              a.id === assignmentId ? { ...a, roles: nextRoles } : a
            ),
          }
        : prev
    );
    await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: nextRoles }),
    });
  }

  async function toggleAssignmentWorkType(
    assignmentId: string,
    type: WorkType,
    checked: boolean
  ) {
    if (!event) return;
    const assignment = event.assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;
    const nextWorkTypes = checked
      ? [...assignment.workTypes, type]
      : assignment.workTypes.filter((t) => t !== type);
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            assignments: prev.assignments.map((a) =>
              a.id === assignmentId ? { ...a, workTypes: nextWorkTypes } : a
            ),
          }
        : prev
    );
    await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workTypes: nextWorkTypes }),
    });
  }

  async function updateEvent(data: {
    title: string;
    startsAt: string;
    endsAt: string;
    days?: { startsAt: string; endsAt: string }[];
    eventTypes: EventType[];
    notes: string | null;
    loadingEnabled: boolean;
    loadingTime: string | null;
    transportEnabled: boolean;
    transportVehicleId: string | null;
  }) {
    if (!event) return;
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) await loadEvent();
  }

  async function deleteEvent() {
    if (!event) return;
    if (!confirm(`Usunąć wydarzenie „${event.title}”?`)) return;
    const removed = event;
    await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    pushUndo({
      label: `Usunięto wydarzenie „${removed.title}”`,
      restore: async () => {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: removed.title,
            startsAt: removed.startsAt,
            endsAt: removed.endsAt,
            color: removed.color,
            eventTypes: removed.eventTypes,
            notes: removed.notes,
            loadingEnabled: removed.loadingEnabled,
            loadingTime: removed.loadingTime,
            transportEnabled: removed.transportEnabled,
            transportVehicleId: removed.transportVehicleId,
          }),
        });
      },
    });
    router.push("/schedule");
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-muted">Nie znaleziono wydarzenia.</p>
        <Link href="/schedule" className="mt-2 inline-block text-sm text-accent-hover hover:underline">
          ← Wróć do grafiku
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-muted">Ładowanie…</p>
      </div>
    );
  }

  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const timeLabel = isSameDay(start, end)
    ? `${format(start, "d MMMM yyyy, EEEE", { locale: pl })} · ${format(start, "HH:mm")}–${format(end, "HH:mm")}`
    : `${format(start, "d MMM yyyy HH:mm", { locale: pl })} – ${format(end, "d MMM yyyy HH:mm", { locale: pl })}`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/schedule" className="text-sm text-muted transition hover:text-foreground">
        ← Wróć do grafiku
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          {event.eventTypes.length > 0 && (
            <div className="mb-2 flex gap-1.5">
              {event.eventTypes.map((type) => (
                <span
                  key={type}
                  className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
                  style={{
                    borderColor: EVENT_TYPE_COLORS[type],
                    color: EVENT_TYPE_COLORS[type],
                    backgroundColor: `${EVENT_TYPE_COLORS[type]}18`,
                  }}
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
                  >
                    {EVENT_TYPE_LETTERS[type]}
                  </span>
                  {EVENT_TYPE_LABELS[type]}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-xl font-semibold text-foreground">{event.title}</h1>
          <p className="mt-1 text-sm text-muted">{timeLabel}</p>
          {(event.loadingEnabled || event.transportEnabled) && (
            <p className="mt-1 text-xs text-muted">
              {event.loadingEnabled && (
                <span>Załadunek: {event.loadingTime || "-"}</span>
              )}
              {event.loadingEnabled && event.transportEnabled && " · "}
              {event.transportEnabled && (
                <span>Transport: {event.transportVehicle?.name || "-"}</span>
              )}
            </p>
          )}
          {event.notes && (
            <p className="mt-2 max-w-md whitespace-pre-wrap rounded-md border border-border-subtle bg-surface p-2.5 text-sm text-foreground">
              {event.notes}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
          >
            Edytuj
          </button>
          <Link
            href={`/reports?event=${event.id}`}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
          >
            Raport
          </Link>
          <EventSmsFlow event={event}>
            {({ openNotify, openRecruit }) => (
              <>
                <button
                  onClick={openNotify}
                  className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
                >
                  Powiadom ekipę
                </button>
                <button
                  onClick={openRecruit}
                  className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
                >
                  Szukaj ekipy
                </button>
              </>
            )}
          </EventSmsFlow>
          <button
            onClick={deleteEvent}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-danger transition hover:border-danger"
          >
            Usuń
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border-subtle bg-surface p-4">
          <EventAssignedPeopleList
            event={event}
            onToggleRole={toggleAssignmentRole}
            onToggleWorkType={toggleAssignmentWorkType}
            onToggleLead={toggleLead}
          />
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Notatnik managera
          </p>
          <textarea
            value={noteDraft}
            onChange={(e) => {
              noteDirtyRef.current = true;
              setNoteDraft(e.target.value);
            }}
            onBlur={saveManagerNote}
            rows={8}
            placeholder="Prywatne notatki widoczne tylko dla admina…"
            className="w-full resize-y rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {noteSaving && <p className="mt-1 text-xs text-muted/60">Zapisywanie…</p>}
        </div>
      </div>

      <div className="mt-6">
        <TaskList event={event} onChange={setEvent} />
      </div>

      {editing && (
        <EventModal
          defaultDate={format(new Date(event.startsAt), "yyyy-MM-dd")}
          event={event}
          vehicles={vehicles}
          onClose={() => setEditing(false)}
          onSubmit={async (data) => {
            await updateEvent(data);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function TaskList({
  event,
  onChange,
}: {
  event: Event;
  onChange: (updater: (prev: Event | null) => Event | null) => void;
}) {
  const [text, setText] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const pending = event.tasks.filter((t) => !t.done);
  const done = event.tasks.filter((t) => t.done);
  const today = startOfDay(new Date()).getTime();

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const res = await fetch("/api/event-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        text: trimmed,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? parseLocalDate(dueDate).toISOString() : null,
      }),
    });
    if (res.ok) {
      const task: EventTask = await res.json();
      onChange((prev) => (prev ? { ...prev, tasks: [...prev.tasks, task] } : prev));
      setText("");
      setAssigneeId("");
      setDueDate("");
    }
  }

  async function toggleDone(task: EventTask) {
    onChange((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === task.id ? { ...t, done: !t.done } : t
            ),
          }
        : prev
    );
    await fetch(`/api/event-tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
  }

  async function removeTask(taskId: string) {
    onChange((prev) =>
      prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) } : prev
    );
    await fetch(`/api/event-tasks/${taskId}`, { method: "DELETE" });
  }

  function renderTask(task: EventTask) {
    const overdue =
      !task.done && task.dueDate && startOfDay(new Date(task.dueDate)).getTime() < today;
    return (
      <li
        key={task.id}
        className="flex items-start gap-2 rounded-md border border-border-subtle bg-background px-3 py-2"
      >
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => toggleDone(task)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-subtle accent-accent"
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm ${
              task.done ? "text-muted/50 line-through" : "text-foreground"
            }`}
          >
            {task.text}
          </p>
          {(task.assignee || task.dueDate) && (
            <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted">
              {task.assignee && <span>{task.assignee.name}</span>}
              {task.dueDate && (
                <span className={overdue ? "text-danger" : ""}>
                  termin: {format(new Date(task.dueDate), "d MMM yyyy", { locale: pl })}
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => removeTask(task.id)}
          className="shrink-0 text-xs text-muted transition hover:text-danger"
        >
          Usuń
        </button>
      </li>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        Zadania
      </p>

      <form onSubmit={addTask} className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
          <label className="text-xs text-muted">Treść</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="np. Zarezerwować busa"
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Osoba (opcjonalnie)</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="">—</option>
            {event.assignments.map((a) => (
              <option key={a.personId} value={a.personId}>
                {a.person.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Termin (opcjonalnie)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Dodaj
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-1.5">
        {event.tasks.length === 0 && (
          <p className="text-sm text-muted/60">Brak zadań.</p>
        )}
        {pending.map(renderTask)}
        {done.map(renderTask)}
      </div>
    </div>
  );
}
