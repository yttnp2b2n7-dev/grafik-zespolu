"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Person } from "@/lib/types";

export function PersonTile({
  person,
  dragging,
}: {
  person: Person;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `person-${person.id}`,
      data: { type: "person", person },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex cursor-grab items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground transition active:cursor-grabbing ${
        isDragging ? "opacity-40" : "hover:border-accent/60"
      } ${dragging ? "shadow-xl" : ""}`}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: person.color }}
      />
      <span className="truncate">{person.name}</span>
    </div>
  );
}
