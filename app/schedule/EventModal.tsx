"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Event } from "@/lib/types";

export function EventModal({
  defaultDate,
  event,
  onClose,
  onSubmit,
}: {
  defaultDate: string;
  event?: Event;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    startsAt: string;
    endsAt: string;
  }) => Promise<void>;
}) {
  const initialStart = event ? new Date(event.startsAt) : null;
  const initialEnd = event ? new Date(event.endsAt) : null;

  const [title, setTitle] = useState(event?.title ?? "");
  const [startDate, setStartDate] = useState(
    initialStart ? format(initialStart, "yyyy-MM-dd") : defaultDate
  );
  const [startTime, setStartTime] = useState(
    initialStart ? format(initialStart, "HH:mm") : "09:00"
  );
  const [endDate, setEndDate] = useState(
    initialEnd ? format(initialEnd, "yyyy-MM-dd") : defaultDate
  );
  const [endTime, setEndTime] = useState(
    initialEnd ? format(initialEnd, "HH:mm") : "10:00"
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(event);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Podaj tytuł wydarzenia");
      return;
    }
    const startsAt = new Date(`${startDate}T${startTime}`);
    const endsAt = new Date(`${endDate}T${endTime}`);
    if (endsAt <= startsAt) {
      setError("Koniec musi być po początku");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-foreground">
          {isEditing ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-muted">Tytuł</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="mt-1 w-full rounded-md border border-border-subtle bg-background px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted">Data początku</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-subtle bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Godzina początku</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-subtle bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Data końca</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-subtle bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Godzina końca</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-subtle bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
            >
              {isEditing ? "Zapisz" : "Dodaj"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
