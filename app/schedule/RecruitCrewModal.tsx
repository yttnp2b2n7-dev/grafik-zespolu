"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event, Person } from "@/lib/types";
import { fetchJsonOrNull } from "@/lib/clientFetch";

const EXTERNAL_SKILL = "zewnętrzny";

export function RecruitCrewModal({
  event,
  onClose,
}: {
  event: Event;
  onClose: () => void;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    { ok: true; sent: number; skipped: string[] } | { ok: false; error: string } | null
  >(null);

  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const dateLabel = isSameDay(start, end)
    ? `${format(start, "d MMMM yyyy", { locale: pl })}, ${format(start, "HH:mm")}–${format(end, "HH:mm")}`
    : `${format(start, "d MMM yyyy HH:mm", { locale: pl })} – ${format(end, "d MMM yyyy HH:mm", { locale: pl })}`;

  const [message, setMessage] = useState(
    `Cześć !\nSzukamy dodatkowego technika na Event ${event.title} (${dateLabel})\nJeśli masz wolny termin odezwij się do Gabrysi 504064410`
  );

  useEffect(() => {
    fetchJsonOrNull<Person[]>("/api/people").then((data) => {
      if (data) setPeople(data);
      setLoading(false);
    });
  }, []);

  const externalPeople = useMemo(
    () =>
      people.filter((p) =>
        p.skills.some((s) => s.skill.name.toLowerCase() === EXTERNAL_SKILL)
      ),
    [people]
  );

  const skillQuery = skillFilter.trim().toLowerCase();
  const filteredPeople = useMemo(
    () =>
      skillQuery
        ? externalPeople.filter(
            (p) =>
              p.name.toLowerCase().includes(skillQuery) ||
              p.skills.some((s) => s.skill.name.toLowerCase().includes(skillQuery))
          )
        : externalPeople,
    [externalPeople, skillQuery]
  );

  const allFilteredSelected =
    filteredPeople.length > 0 &&
    filteredPeople.every((p) => selectedIds.has(p.id));

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const p of filteredPeople) next.delete(p.id);
      } else {
        for (const p of filteredPeople) next.add(p.id);
      }
      return next;
    });
  }

  function togglePerson(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/people/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personIds: [...selectedIds], text: message }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, sent: data.sent, skipped: data.skipped });
      } else {
        setResult({ ok: false, error: data.error ?? "Nie udało się wysłać" });
      }
    } catch {
      setResult({ ok: false, error: "Nie udało się wysłać" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-xl">
        <div className="border-b border-border-subtle p-5 pb-3">
          <h2 className="text-base font-semibold text-foreground">
            Szukaj ekipy — {event.title}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Wysyłka SMS do zewnętrznych osób (tag „zewnętrzny” w umiejętnościach)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-3">
          <input
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="Filtruj po imieniu lub umiejętności…"
            className="mb-2 w-full rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />

          {loading && <p className="text-sm text-muted">Ładowanie…</p>}

          {!loading && externalPeople.length === 0 && (
            <p className="text-sm text-muted/60">
              Brak osób oznaczonych tagiem „zewnętrzny” w umiejętnościach. Dodaj go
              osobom w zakładce „Ludzie”.
            </p>
          )}

          {!loading && externalPeople.length > 0 && (
            <>
              <label className="mb-1.5 flex items-center gap-2 border-b border-border-subtle pb-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-border-subtle accent-accent"
                />
                Zaznacz wszystkich ({filteredPeople.length})
              </label>

              <div className="flex flex-col gap-1">
                {filteredPeople.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm text-foreground hover:bg-surface-hover"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => togglePerson(p.id)}
                      className="h-3.5 w-3.5 shrink-0 rounded border-border-subtle accent-accent"
                    />
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {!p.phone && (
                      <span className="shrink-0 text-[10px] text-muted/50">
                        brak numeru
                      </span>
                    )}
                  </label>
                ))}
                {filteredPeople.length === 0 && (
                  <p className="px-1.5 text-xs text-muted/60">
                    Brak wyników dla tego filtra.
                  </p>
                )}
              </div>
            </>
          )}

          <p className="mb-1 mt-4 text-xs font-medium uppercase tracking-wide text-muted">
            Treść SMS
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />

          {result && (
            <p
              className={`mt-2 text-xs ${result.ok ? "text-emerald-500" : "text-red-500"}`}
            >
              {result.ok
                ? `Wysłano SMS do ${result.sent} osób${
                    result.skipped.length > 0
                      ? ` (bez numeru: ${result.skipped.join(", ")})`
                      : ""
                  }.`
                : `Błąd: ${result.error}`}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-subtle p-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
          >
            Zamknij
          </button>
          <button
            onClick={handleSend}
            disabled={selectedIds.size === 0 || !message.trim() || sending}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {sending ? "Wysyłanie…" : `Wyślij (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
