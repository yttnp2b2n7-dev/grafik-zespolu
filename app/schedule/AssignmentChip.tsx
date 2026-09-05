"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Assignment } from "@/lib/types";

export function AssignmentChip({
  assignment,
  eventId,
  onRemove,
  readOnly,
}: {
  assignment: Assignment;
  eventId: string;
  onRemove: () => void;
  readOnly?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `assignment-${assignment.id}`,
    data: {
      type: "assignment",
      assignmentId: assignment.id,
      sourceEventId: eventId,
      person: assignment.person,
    },
    disabled: readOnly,
  });

  return (
    <span
      ref={setNodeRef}
      {...(readOnly ? {} : { ...listeners, ...attributes })}
      className={`flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5 text-xs text-foreground transition ${
        readOnly ? "" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-40" : ""}`}
      style={{ backgroundColor: `${assignment.person.color}22` }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: assignment.person.color }}
      />
      {assignment.person.name}
      {!readOnly && (
        <button
          onClick={onRemove}
          className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted/70 hover:bg-danger/20 hover:text-danger"
          aria-label={`Usuń ${assignment.person.name} z wydarzenia`}
        >
          ×
        </button>
      )}
    </span>
  );
}
