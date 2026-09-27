"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { Person, Vacation } from "@/lib/types";
import { fetchJsonOrNull } from "@/lib/clientFetch";
import { parseLocalDate } from "@/lib/localDate";
import { useUndo } from "@/lib/undo-context";

export function VacationsPanel({ people }: { people: Person[] }) {
  const pushUndo = useUndo();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [personId, setPersonId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadVacations() {
    const data = await fetchJsonOrNull<Vacation[]>("/api/vacations");
    if (data) setVacations(data);
    setLoading(false);
  }

  useEffect(() => {
    loadVacations();
    const interval = setInterval(loadVacations, 5000);
    return () => clearInterval(interval);
  }, []);

  async function addVacation(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!personId || !startDate || !endDate) return;

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    if (end < start) {
      setError("Data „do” nie może być wcześniejsza niż data „od”.");
      return;
    }

    const res = await fetch("/api/vacations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        note: note.trim() || null,
      }),
    });
    if (!res.ok) {
      setError("Nie udało się dodać urlopu");
      return;
    }
    setStartDate("");
    setEndDate("");
    setNote("");
    await loadVacations();
  }

  async function removeVacation(vacation: Vacation) {
    setVacations((prev) => prev.filter((v) => v.id !== vacation.id));
    await fetch(`/api/vacations/${vacation.id}`, { method: "DELETE" });

    pushUndo({
      label: `Usunięto urlop „${vacation.person?.name ?? ""}”`,
      restore: async () => {
        await fetch("/api/vacations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId: vacation.personId,
            startDate: vacation.startDate,
            endDate: vacation.endDate,
            note: vacation.note,
          }),
        });
        await loadVacations();
      },
    });
  }

  function formatRange(v: Vacation) {
    const start = new Date(v.startDate);
    const end = new Date(v.endDate);
    return start.toDateString() === end.toDateString()
      ? format(start, "d MMMM yyyy", { locale: pl })
      : `${format(start, "d MMMM yyyy", { locale: pl })} – ${format(end, "d MMMM yyyy", { locale: pl })}`;
  }

  return (
    <div>
      <form
        onSubmit={addVacation}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-surface p-4"
      >
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label className="text-xs text-muted">Osoba</label>
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            required
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="" disabled>
              Wybierz osobę…
            </option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Od</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Do</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <label className="text-xs text-muted">Powód (opcjonalnie)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="np. urlop wypoczynkowy"
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Dodaj urlop
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex flex-col gap-2">
        {loading && <p className="text-sm text-muted">Ładowanie…</p>}
        {!loading && vacations.length === 0 && (
          <p className="text-sm text-muted">Brak zaplanowanych urlopów.</p>
        )}
        {vacations.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {v.person?.name ?? "Nieznana osoba"}
              </p>
              <p className="text-xs text-muted">
                {formatRange(v)}
                {v.note ? ` · ${v.note}` : ""}
              </p>
            </div>
            <button
              onClick={() => removeVacation(v)}
              className="shrink-0 text-xs text-muted transition hover:text-danger"
            >
              Usuń
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
