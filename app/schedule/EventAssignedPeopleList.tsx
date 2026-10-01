"use client";

import { useState } from "react";
import type { Event } from "@/lib/types";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_LETTERS,
  EVENT_TYPE_OPTIONS,
  type EventType,
} from "@/lib/eventType";
import {
  LEAD_COLOR,
  LEAD_LABEL,
  LeadIcon,
  WORK_TYPE_COLORS,
  WORK_TYPE_LABELS,
  WORK_TYPE_OPTIONS,
  WorkTypeIcon,
  type WorkType,
} from "@/lib/workType";

export function EventAssignedPeopleList({
  event,
  onToggleRole,
  onToggleWorkType,
  onToggleLead,
  hideSkills,
  collapsible,
}: {
  event: Event;
  onToggleRole?: (assignmentId: string, type: EventType, checked: boolean) => void;
  onToggleWorkType?: (assignmentId: string, type: WorkType, checked: boolean) => void;
  onToggleLead?: (assignmentId: string, isLead: boolean) => void;
  hideSkills?: boolean;
  // Only the full admin event page collapses a large crew to 3 + "Pokaż
  // więcej" - the visitor quick-view modal and month-view popup reuse this
  // same list but always show everyone, since collapsing a list inside an
  // already-small popup just adds an extra click for no space saved.
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_LIMIT = 3;
  const visibleAssignments =
    expanded || !collapsible
      ? event.assignments
      : event.assignments.slice(0, COLLAPSED_LIMIT);

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        Przypisani ({event.assignments.length})
      </p>
      {event.assignments.length === 0 ? (
        <p className="text-sm text-muted/60">Brak przypisanych osób.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {visibleAssignments.map((a) => {
            const availableTypes = EVENT_TYPE_OPTIONS.filter((type) =>
              event.eventTypes.includes(type)
            );
            const editable = !hideSkills && !!onToggleRole;
            const workTypeEditable = !hideSkills && !!onToggleWorkType;
            const leadEditable = !hideSkills && !!onToggleLead;
            return (
              <li
                key={a.id}
                className="flex flex-col gap-1.5 rounded-md border border-border-subtle bg-background px-3 py-1.5 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground">{a.person.name}</span>
                  {!hideSkills && a.person.skills.length > 0 && (
                    <span className="text-xs text-muted">
                      ({a.person.skills.map((s) => s.skill.name).join(", ")})
                    </span>
                  )}
                </div>
                {(workTypeEditable ||
                  leadEditable ||
                  a.workTypes.length > 0 ||
                  a.isLead) && (
                  <div className="flex flex-wrap gap-1">
                    {WORK_TYPE_OPTIONS.map((type) => {
                      const active = a.workTypes.includes(type);
                      if (!workTypeEditable) {
                        return active ? (
                          <span
                            key={type}
                            className="flex h-5 w-5 items-center justify-center rounded text-white"
                            style={{ backgroundColor: WORK_TYPE_COLORS[type] }}
                            title={WORK_TYPE_LABELS[type]}
                          >
                            <WorkTypeIcon type={type} className="h-3 w-3" />
                          </span>
                        ) : null;
                      }
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => onToggleWorkType(a.id, type, !active)}
                          title={WORK_TYPE_LABELS[type]}
                          aria-pressed={active}
                          className={`flex h-5 w-5 items-center justify-center rounded transition ${
                            active
                              ? "text-white"
                              : "border border-border-subtle text-muted/50 hover:border-accent hover:text-foreground"
                          }`}
                          style={
                            active
                              ? { backgroundColor: WORK_TYPE_COLORS[type] }
                              : undefined
                          }
                        >
                          <WorkTypeIcon type={type} className="h-3 w-3" />
                        </button>
                      );
                    })}
                    {leadEditable ? (
                      <button
                        type="button"
                        onClick={() => onToggleLead(a.id, !a.isLead)}
                        title={LEAD_LABEL}
                        aria-pressed={a.isLead}
                        className={`flex h-5 w-5 items-center justify-center rounded transition ${
                          a.isLead
                            ? "text-white"
                            : "border border-border-subtle text-muted/50 hover:border-accent hover:text-foreground"
                        }`}
                        style={a.isLead ? { backgroundColor: LEAD_COLOR } : undefined}
                      >
                        <LeadIcon className="h-3 w-3" />
                      </button>
                    ) : (
                      a.isLead && (
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded text-white"
                          style={{ backgroundColor: LEAD_COLOR }}
                          title={LEAD_LABEL}
                        >
                          <LeadIcon className="h-3 w-3" />
                        </span>
                      )
                    )}
                  </div>
                )}
                {availableTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {availableTypes.map((type) => {
                      const active = a.roles.includes(type);
                      if (!editable) {
                        return active ? (
                          <span
                            key={type}
                            className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold leading-none text-white"
                            style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
                            title={EVENT_TYPE_LABELS[type]}
                          >
                            {EVENT_TYPE_LETTERS[type]}
                          </span>
                        ) : null;
                      }
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => onToggleRole(a.id, type, !active)}
                          title={EVENT_TYPE_LABELS[type]}
                          aria-pressed={active}
                          className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold leading-none transition ${
                            active
                              ? "text-white"
                              : "border border-border-subtle text-muted/50 hover:border-accent hover:text-foreground"
                          }`}
                          style={
                            active
                              ? { backgroundColor: EVENT_TYPE_COLORS[type] }
                              : undefined
                          }
                        >
                          {EVENT_TYPE_LETTERS[type]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {collapsible && event.assignments.length > COLLAPSED_LIMIT && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 w-full rounded-md border border-border-subtle px-2 py-1 text-xs text-muted transition hover:border-accent hover:text-foreground"
        >
          {expanded
            ? "Zwiń listę"
            : `Pokaż więcej (${event.assignments.length - COLLAPSED_LIMIT})`}
        </button>
      )}
    </div>
  );
}
