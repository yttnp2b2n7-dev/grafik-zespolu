"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Assignment } from "@/lib/types";
import { getPersonColor } from "@/lib/personGroup";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LETTERS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_OPTIONS,
} from "@/lib/eventType";

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

  const color = getPersonColor(assignment.person);

  return (
    <span
      ref={setNodeRef}
      {...(readOnly ? {} : { ...listeners, ...attributes })}
      className={`flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5 text-xs text-foreground transition ${
        readOnly ? "" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-40" : ""}`}
      style={{ backgroundColor: `${color}22` }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
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
      {assignment.roles.length > 0 && (
        <span className="flex items-center gap-0.5">
          {EVENT_TYPE_OPTIONS.filter((type) => assignment.roles.includes(type)).map(
            (type) => (
              <span
                key={type}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] text-[8px] font-bold leading-none text-white"
                style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
                title={EVENT_TYPE_LABELS[type]}
              >
                {EVENT_TYPE_LETTERS[type]}
              </span>
            )
          )}
        </span>
      )}
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
