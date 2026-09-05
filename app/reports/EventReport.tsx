"use client";

import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";
import { formatEventReportText, getEventDateTimeLabel } from "@/lib/eventReportText";

export function EventReport({ event }: { event: Event }) {
  const [copied, setCopied] = useState(false);
  const { dateLabel, timeLabel } = getEventDateTimeLabel(event);

  async function handleCopy() {
    await navigator.clipboard.writeText(formatEventReportText(event));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{event.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {dateLabel} · {timeLabel}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-border-subtle px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-foreground"
        >
          {copied ? "Skopiowano" : "Kopiuj"}
        </button>
      </div>

      {event.days.length > 1 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Godziny w poszczególnych dniach
          </p>
          <ul className="flex flex-col gap-1.5">
            {event.days.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-md border border-border-subtle bg-background px-3 py-1.5 text-sm"
              >
                <span className="text-foreground">
                  {format(new Date(d.startsAt), "d MMMM yyyy, EEEE", { locale: pl })}
                </span>
                <span className="text-xs text-muted">
                  {format(new Date(d.startsAt), "HH:mm")}–{format(new Date(d.endsAt), "HH:mm")}
                </span>
              </li>
            ))}
          </ul>
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
                <span className="text-foreground">{a.person.name}</span>
                {a.person.skills.length > 0 && (
                  <span className="text-xs text-muted">
                    ({a.person.skills.map((s) => s.skill.name).join(", ")})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
