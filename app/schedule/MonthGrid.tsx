"use client";

import { useState } from "react";
import Link from "next/link";
import { format, isSameDay, isSameMonth } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";
import { getEventTypeAccentColor } from "@/lib/eventType";
import { DEFAULT_EVENT_COLOR } from "@/lib/eventColors";
import { EventDetailsModal } from "./EventDetailsModal";

const DAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nie"];
const MAX_VISIBLE = 3;

function sortByStart(events: Event[]): Event[] {
  return [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

// Month view is deliberately view-only (no drag & drop, no quick-add on an
// empty day) - it exists to separate manager-style "what's coming up this
// month" browsing from the week/day view's scheduling work.
export function MonthGrid({
  days,
  monthAnchor,
  events,
  expandedDay,
  onExpandDay,
  onCollapseDay,
  readOnly,
}: {
  days: Date[];
  monthAnchor: Date;
  events: Event[];
  expandedDay: Date | null;
  onExpandDay: (day: Date) => void;
  onCollapseDay: () => void;
  readOnly?: boolean;
}) {
  // Visitors can't reach the admin-only /schedule/[eventId] page (middleware
  // redirects them straight back), so their event bars open the same
  // read-only quick-view modal "Szczegóły" uses elsewhere instead of linking.
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[900px] grid-cols-7 gap-2">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-1 text-xs font-medium uppercase tracking-wide text-muted"
          >
            {label}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = sortByStart(
            events.filter((ev) => isSameDay(new Date(ev.startsAt), day))
          );
          const visible = dayEvents.slice(0, MAX_VISIBLE);
          const overflowCount = dayEvents.length - visible.length;
          const inMonth = isSameMonth(day, monthAnchor);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[110px] rounded-md border p-1.5 ${
                inMonth
                  ? "border-border-subtle bg-surface/50"
                  : "border-border-subtle/50 bg-surface/20"
              }`}
            >
              <p
                className={`text-xs ${
                  inMonth ? "text-foreground" : "text-muted/40"
                } ${isToday ? "font-semibold text-accent" : ""}`}
              >
                {format(day, "d")}
              </p>
              <div className="mt-1 flex flex-col gap-1">
                {visible.map((ev) => {
                  const accent =
                    getEventTypeAccentColor(ev.eventTypes) ??
                    ev.color ??
                    DEFAULT_EVENT_COLOR;
                  const className =
                    "block w-full truncate rounded px-1 py-0.5 text-left text-[11px] text-white transition hover:opacity-80";
                  return readOnly ? (
                    <button
                      key={ev.id}
                      onClick={() => setDetailsEvent(ev)}
                      title={ev.title}
                      className={className}
                      style={{ backgroundColor: accent }}
                    >
                      {ev.title}
                    </button>
                  ) : (
                    <Link
                      key={ev.id}
                      href={`/schedule/${ev.id}`}
                      title={ev.title}
                      className={className}
                      style={{ backgroundColor: accent }}
                    >
                      {ev.title}
                    </Link>
                  );
                })}
                {overflowCount > 0 && (
                  <button
                    onClick={() => onExpandDay(day)}
                    className="text-left text-[11px] text-muted transition hover:text-foreground"
                  >
                    +{overflowCount} więcej
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {expandedDay && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4"
          onClick={onCollapseDay}
        >
          <div
            className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border-subtle bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold capitalize text-foreground">
              {format(expandedDay, "EEEE, d MMMM yyyy", { locale: pl })}
            </h3>
            <div className="mt-3 flex flex-col gap-1.5">
              {sortByStart(
                events.filter((ev) => isSameDay(new Date(ev.startsAt), expandedDay))
              ).map((ev) => {
                const accent =
                  getEventTypeAccentColor(ev.eventTypes) ??
                  ev.color ??
                  DEFAULT_EVENT_COLOR;
                const dot = (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                );
                return readOnly ? (
                  <button
                    key={ev.id}
                    onClick={() => setDetailsEvent(ev)}
                    className="flex items-center gap-2 rounded-md border border-border-subtle px-2.5 py-1.5 text-left text-sm text-foreground transition hover:border-accent"
                  >
                    {dot}
                    <span className="truncate">{ev.title}</span>
                  </button>
                ) : (
                  <Link
                    key={ev.id}
                    href={`/schedule/${ev.id}`}
                    className="flex items-center gap-2 rounded-md border border-border-subtle px-2.5 py-1.5 text-sm text-foreground transition hover:border-accent"
                  >
                    {dot}
                    <span className="truncate">{ev.title}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={onCollapseDay}
                className="text-xs text-muted transition hover:text-foreground"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsEvent && (
        <EventDetailsModal
          event={detailsEvent}
          onClose={() => setDetailsEvent(null)}
          hideSkills
        />
      )}
    </div>
  );
}
