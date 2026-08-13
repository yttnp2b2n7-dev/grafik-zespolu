"use client";

import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import Link from "next/link";
import type { Event } from "@/lib/types";

export function EventCard({
  event,
  onRemoveAssignment,
  onDelete,
}: {
  event: Event;
  onRemoveAssignment: (assignmentId: string) => void;
  onDelete: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `event-${event.id}`,
    data: { type: "event", eventId: event.id },
  });

  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const timeLabel = isSameDay(start, end)
    ? `${format(start, "HH:mm")}–${format(end, "HH:mm")}`
    : `${format(start, "d MMM HH:mm", { locale: pl })} – ${format(
        end,
        "d MMM HH:mm",
        { locale: pl }
      )}`;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border p-3 transition ${
        isOver
          ? "border-accent bg-accent/10"
          : "border-border-subtle bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {event.title}
          </p>
          <p className="text-xs text-muted">{timeLabel}</p>
        </div>
        <button
          onClick={onDelete}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
          aria-label="Usuń wydarzenie"
        >
          ×
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {event.assignments.map((a) => (
          <span
            key={a.id}
            className="flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5 text-xs text-foreground"
            style={{ backgroundColor: `${a.person.color}22` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: a.person.color }}
            />
            {a.person.name}
            <button
              onClick={() => onRemoveAssignment(a.id)}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted/70 hover:bg-danger/20 hover:text-danger"
              aria-label={`Usuń ${a.person.name} z wydarzenia`}
            >
              ×
            </button>
          </span>
        ))}
        {event.assignments.length === 0 && (
          <span className="text-xs text-muted/50">Przeciągnij tu osobę…</span>
        )}
      </div>

      <Link
        href={`/reports?event=${event.id}`}
        className="mt-2 inline-block text-xs text-muted/70 underline-offset-2 transition hover:text-accent-hover hover:underline"
      >
        Raport
      </Link>
    </div>
  );
}
