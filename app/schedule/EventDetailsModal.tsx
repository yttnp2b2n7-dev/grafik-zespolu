"use client";

import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_LETTERS,
} from "@/lib/eventType";

export function EventDetailsModal({
  event,
  onClose,
  hideSkills,
}: {
  event: Event;
  onClose: () => void;
  hideSkills?: boolean;
}) {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const timeLabel = isSameDay(start, end)
    ? `${format(start, "d MMMM yyyy, EEEE", { locale: pl })} · ${format(start, "HH:mm")}–${format(end, "HH:mm")}`
    : `${format(start, "d MMM yyyy HH:mm", { locale: pl })} – ${format(end, "d MMM yyyy HH:mm", { locale: pl })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border-subtle bg-surface p-5 shadow-xl">
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

        <h2 className="text-base font-semibold text-foreground">
          {event.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{timeLabel}</p>

        {(event.loadingEnabled || event.transportEnabled) && (
          <p className="mt-2 text-xs text-muted">
            {event.loadingEnabled && (
              <span>Załadunek: {event.loadingTime || "-"}</span>
            )}
            {event.loadingEnabled && event.transportEnabled && " · "}
            {event.transportEnabled && (
              <span>Transport: {event.transportVehicle || "-"}</span>
            )}
          </p>
        )}

        {event.notes && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
              Uwagi
            </p>
            <p className="whitespace-pre-wrap rounded-md border border-border-subtle bg-background p-2.5 text-sm text-foreground">
              {event.notes}
            </p>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Przypisani ({event.assignments.length})
          </p>
          {event.assignments.length === 0 ? (
            <p className="text-sm text-muted/60">Brak przypisanych osób.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {event.assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border-subtle bg-background px-3 py-1.5 text-sm"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: a.person.color }}
                  />
                  {a.isLead && (
                    <span className="text-yellow-400" title="Dowódca wydarzenia">
                      ★
                    </span>
                  )}
                  <span className="text-foreground">{a.person.name}</span>
                  {!hideSkills && a.person.skills.length > 0 && (
                    <span className="text-xs text-muted">
                      ({a.person.skills.map((s) => s.skill.name).join(", ")})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
