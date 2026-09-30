"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";
import { CrewSmsModal } from "./CrewSmsModal";

const EXTERNAL_SKILL = "zewnętrzny";

// Owns the "Powiadom ekipę" / "Szukaj ekipy" SMS flow for an event: a
// caller can trigger either directly (openNotify/openRecruit, e.g. two
// buttons on the event page), or route both through one entry point
// (openChoice, e.g. a single "SMS" action on the schedule card) that asks
// which one first.
export function EventSmsFlow({
  event,
  children,
}: {
  event: Event;
  children: (controls: {
    openChoice: () => void;
    openNotify: () => void;
    openRecruit: () => void;
  }) => React.ReactNode;
}) {
  const [choosing, setChoosing] = useState(false);
  const [smsFlow, setSmsFlow] = useState<"notify" | "recruit" | null>(null);
  const [smsMode, setSmsMode] = useState<"auto" | "custom" | null>(null);

  function closeSms() {
    setSmsFlow(null);
    setSmsMode(null);
  }

  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  // Matches the exact wording already confirmed working for each message.
  const notifyDateLabel = isSameDay(start, end)
    ? `${format(start, "d.MM")} ${format(start, "HH:mm")}-${format(end, "HH:mm")}`
    : `${format(start, "d.MM HH:mm")}-${format(end, "d.MM HH:mm")}`;
  const recruitDateLabel = isSameDay(start, end)
    ? `${format(start, "d MMMM yyyy", { locale: pl })}, ${format(start, "HH:mm")}–${format(end, "HH:mm")}`
    : `${format(start, "d MMM yyyy HH:mm", { locale: pl })} – ${format(end, "d MMM yyyy HH:mm", { locale: pl })}`;

  return (
    <>
      {children({
        openChoice: () => setChoosing(true),
        openNotify: () => setSmsFlow("notify"),
        openRecruit: () => setSmsFlow("recruit"),
      })}

      {choosing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xs rounded-lg border border-border-subtle bg-surface p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-foreground">SMS</h3>
            <p className="mt-1 text-xs text-muted">Wybierz, do kogo wysłać SMS.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  setChoosing(false);
                  setSmsFlow("notify");
                }}
                className="rounded-md border border-border-subtle px-3 py-2 text-left text-sm text-foreground transition hover:border-accent"
              >
                Powiadom ekipę
              </button>
              <button
                onClick={() => {
                  setChoosing(false);
                  setSmsFlow("recruit");
                }}
                className="rounded-md border border-border-subtle px-3 py-2 text-left text-sm text-foreground transition hover:border-accent"
              >
                Szukaj ekipy
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setChoosing(false)}
                className="text-xs text-muted transition hover:text-foreground"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {smsFlow && !smsMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xs rounded-lg border border-border-subtle bg-surface p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-foreground">
              {smsFlow === "notify" ? "Powiadom ekipę" : "Szukaj ekipy"}
            </h3>
            <p className="mt-1 text-xs text-muted">Wybierz treść wiadomości SMS.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => setSmsMode("auto")}
                className="rounded-md border border-border-subtle px-3 py-2 text-left text-sm text-foreground transition hover:border-accent"
              >
                Wyślij wiadomość automatyczną
              </button>
              <button
                onClick={() => setSmsMode("custom")}
                className="rounded-md border border-border-subtle px-3 py-2 text-left text-sm text-foreground transition hover:border-accent"
              >
                Wyślij swoją wiadomość
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSmsFlow(null)}
                className="text-xs text-muted transition hover:text-foreground"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {smsFlow === "notify" && smsMode && (
        <CrewSmsModal
          heading={`Powiadom ekipę — ${event.title}`}
          subtitle="Wysyłka SMS do osób przypisanych do tego wydarzenia"
          emptyMessage="Brak osób przypisanych do tego wydarzenia."
          candidateFilter={(p) =>
            event.assignments.some((a) => a.personId === p.id)
          }
          defaultMessage={
            smsMode === "auto"
              ? `Cześć!\nMasz robotę do wykonania!\nKlapek oczekuje cię ${notifyDateLabel}\nOdwiedź grafik, a dowiesz się więcej na temat tej sztuki.`
              : ""
          }
          preselectAll
          onClose={closeSms}
        />
      )}

      {smsFlow === "recruit" && smsMode && (
        <CrewSmsModal
          heading={`Szukaj ekipy — ${event.title}`}
          subtitle="Wysyłka SMS do zewnętrznych osób (tag „zewnętrzny” w umiejętnościach)"
          emptyMessage={`Brak osób oznaczonych tagiem „zewnętrzny” w umiejętnościach. Dodaj go osobom w zakładce „Ludzie”.`}
          candidateFilter={(p) =>
            p.skills.some((s) => s.skill.name.toLowerCase() === EXTERNAL_SKILL)
          }
          defaultMessage={
            smsMode === "auto"
              ? `Cześć!\nSzukamy dodatkowego technika na Event ${event.title} (${recruitDateLabel})\nJeśli masz wolny termin, odezwij się do Gabrysi 504064410`
              : ""
          }
          onClose={closeSms}
        />
      )}
    </>
  );
}
