import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";

export function EventReport({ event }: { event: Event }) {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const dateLabel = isSameDay(start, end)
    ? format(start, "d MMMM yyyy, EEEE", { locale: pl })
    : `${format(start, "d MMMM yyyy", { locale: pl })} – ${format(end, "d MMMM yyyy", { locale: pl })}`;
  const timeLabel = `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">{event.title}</h2>
      <p className="mt-1 text-sm text-muted">
        {dateLabel} · {timeLabel}
      </p>

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
