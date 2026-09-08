"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Assignment } from "@/lib/types";

export function AssignmentChip({
  assignment,
  eventId,
  onRemove,
  onToggleLead,
  readOnly,
}: {
  assignment: Assignment;
  eventId: string;
  onRemove: () => void;
  onToggleLead?: () => void;
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
      {!readOnly && onToggleLead ? (
        <button
          onClick={onToggleLead}
          className={`leading-none transition ${
            assignment.isLead
              ? "text-yellow-400"
              : "text-muted/30 hover:text-yellow-400/70"
          }`}
          aria-label={
            assignment.isLead
              ? `Odznacz ${assignment.person.name} jako dowódcę`
              : `Oznacz ${assignment.person.name} jako dowódcę`
          }
          title={assignment.isLead ? "Dowódca wydarzenia" : "Ustaw jako dowódcę"}
        >
          {assignment.isLead ? "★" : "☆"}
        </button>
      ) : (
        assignment.isLead && (
          <span
            className="leading-none text-yellow-400"
            title="Dowódca wydarzenia"
            aria-label="Dowódca wydarzenia"
          >
            ★
          </span>
        )
      )}
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
