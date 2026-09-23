"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_LETTERS,
} from "@/lib/eventType";
import { CrewSmsModal } from "./CrewSmsModal";
import { getPersonColor } from "@/lib/personGroup";

const EXTERNAL_SKILL = "zewnętrzny";

export function EventDetailsModal({
  event,
  onClose,
  hideSkills,
}: {
  event: Event;
  onClose: () => void;
  hideSkills?: boolean;
}) {
  const [activeSmsModal, setActiveSmsModal] = useState<"notify" | "recruit" | null>(
    null
  );

  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const timeLabel = isSameDay(start, end)
    ? `${format(start, "d MMMM yyyy, EEEE", { locale: pl })} · ${format(start, "HH:mm")}–${format(end, "HH:mm")}`
    : `${format(start, "d MMM yyyy HH:mm", { locale: pl })} – ${format(end, "d MMM yyyy HH:mm", { locale: pl })}`;
  // Matches the exact wording already confirmed working for each message.
  const notifyDateLabel = isSameDay(start, end)
    ? `${format(start, "d.MM")} ${format(start, "HH:mm")}-${format(end, "HH:mm")}`
    : `${format(start, "d.MM HH:mm")}-${format(end, "d.MM HH:mm")}`;
  const recruitDateLabel = isSameDay(start, end)
    ? `${format(start, "d MMMM yyyy", { locale: pl })}, ${format(start, "HH:mm")}–${format(end, "HH:mm")}`
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
                    style={{ backgroundColor: getPersonColor(a.person) }}
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

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {!hideSkills && event.assignments.length > 0 && (
            <button
              onClick={() => setActiveSmsModal("notify")}
              className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
            >
              Powiadom ekipę
            </button>
          )}
          {!hideSkills && (
            <button
              onClick={() => setActiveSmsModal("recruit")}
              className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
            >
              Szukaj ekipy
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
          >
            Zamknij
          </button>
        </div>
      </div>

      {activeSmsModal === "notify" && (
        <CrewSmsModal
          heading={`Powiadom ekipę — ${event.title}`}
          subtitle="Wysyłka SMS do osób przypisanych do tego wydarzenia"
          emptyMessage="Brak osób przypisanych do tego wydarzenia."
          candidateFilter={(p) =>
            event.assignments.some((a) => a.personId === p.id)
          }
          defaultMessage={`Cześć!\nMasz robotę do wykonania!\nKlapek oczekuje cię ${notifyDateLabel}\nOdwiedź grafik a dowiesz się więcej na temat tej sztuki.`}
          preselectAll
          onClose={() => setActiveSmsModal(null)}
        />
      )}

      {activeSmsModal === "recruit" && (
        <CrewSmsModal
          heading={`Szukaj ekipy — ${event.title}`}
          subtitle="Wysyłka SMS do zewnętrznych osób (tag „zewnętrzny” w umiejętnościach)"
          emptyMessage={`Brak osób oznaczonych tagiem „zewnętrzny” w umiejętnościach. Dodaj go osobom w zakładce „Ludzie”.`}
          candidateFilter={(p) =>
            p.skills.some((s) => s.skill.name.toLowerCase() === EXTERNAL_SKILL)
          }
          defaultMessage={`Cześć !\nSzukamy dodatkowego technika na Event ${event.title} (${recruitDateLabel})\nJeśli masz wolny termin odezwij się do Gabrysi 504064410`}
          onClose={() => setActiveSmsModal(null)}
        />
      )}
    </div>
  );
}
