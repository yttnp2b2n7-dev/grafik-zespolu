"use client";

import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import Link from "next/link";
import type { Event } from "@/lib/types";
import { AssignmentChip } from "./AssignmentChip";

export function EventCard({
  event,
  onRemoveAssignment,
  onDelete,
  onEdit,
  readOnly,
}: {
  event: Event;
  onRemoveAssignment: (assignmentId: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  readOnly?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `event-${event.id}`,
    data: { type: "event", eventId: event.id },
    disabled: readOnly,
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
  const hasPerDayTimes = event.days.length > 1;

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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {event.title}
          </p>
          {hasPerDayTimes ? (
            <div className="mt-1 flex gap-1">
              {event.days.map((d) => {
                const dayStart = new Date(d.startsAt);
                const dayEnd = new Date(d.endsAt);
                return (
                  <div key={d.id} className="min-w-0 flex-1 text-center">
                    <p className="truncate text-[10px] uppercase tracking-wide text-muted/60">
                      {format(dayStart, "d MMM", { locale: pl })}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {format(dayStart, "HH:mm")}–{format(dayEnd, "HH:mm")}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted">{timeLabel}</p>
          )}
        </div>
        {!readOnly && (
          <button
            onClick={onDelete}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
            aria-label="Usuń wydarzenie"
          >
            ×
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {event.assignments.map((a) => (
          <AssignmentChip
            key={a.id}
            assignment={a}
            eventId={event.id}
            onRemove={() => onRemoveAssignment(a.id)}
            readOnly={readOnly}
          />
        ))}
        {event.assignments.length === 0 && (
          <span className="text-xs text-muted/50">
            {readOnly ? "Brak przypisanych osób" : "Przeciągnij tu osobę…"}
          </span>
        )}
      </div>

      {!readOnly && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted/70">
          <button
            onClick={onEdit}
            className="underline-offset-2 transition hover:text-accent-hover hover:underline"
          >
            Edytuj
          </button>
          <span>·</span>
          <Link
            href={`/reports?event=${event.id}`}
            className="underline-offset-2 transition hover:text-accent-hover hover:underline"
          >
            Raport
          </Link>
        </div>
      )}
    </div>
  );
}
