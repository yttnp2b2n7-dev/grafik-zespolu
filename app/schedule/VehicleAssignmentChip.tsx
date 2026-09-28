"use client";

import { useDraggable } from "@dnd-kit/core";
import type { VehicleAssignment } from "@/lib/types";

const VEHICLE_COLOR = "#f59e0b";

export function VehicleAssignmentChip({
  assignment,
  eventId,
  onRemove,
  readOnly,
}: {
  assignment: VehicleAssignment;
  eventId: string;
  onRemove: () => void;
  readOnly?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `vehicle-assignment-${assignment.id}`,
    data: {
      type: "vehicleAssignment",
      assignmentId: assignment.id,
      sourceEventId: eventId,
      vehicle: assignment.vehicle,
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
      style={{ backgroundColor: `${VEHICLE_COLOR}22` }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: VEHICLE_COLOR }}
      />
      {assignment.vehicle.name}
      {!readOnly && (
        <button
          onClick={onRemove}
          className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted/70 hover:bg-danger/20 hover:text-danger"
          aria-label={`Usuń ${assignment.vehicle.name} z wydarzenia`}
        >
          ×
        </button>
      )}
    </span>
  );
}
