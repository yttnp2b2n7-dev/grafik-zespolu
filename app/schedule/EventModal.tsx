"use client";

import { useEffect, useState } from "react";
import { eachDayOfInterval, format } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";

type DayTime = { start: string; end: string };

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
    days?: { startsAt: string; endsAt: string }[];
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

  const [dayTimes, setDayTimes] = useState<Record<string, DayTime>>({});

  const isEditing = Boolean(event);

  let dateRange: Date[] = [];
  try {
    if (startDate && endDate && startDate <= endDate) {
      dateRange = eachDayOfInterval({
        start: new Date(`${startDate}T00:00`),
        end: new Date(`${endDate}T00:00`),
      });
    }
  } catch {
    dateRange = [];
  }
  const isMultiDay = dateRange.length > 1;

  useEffect(() => {
    if (!isMultiDay) return;
    setDayTimes((prev) => {
      const next: Record<string, DayTime> = {};
      for (const day of dateRange) {
        const key = format(day, "yyyy-MM-dd");
        next[key] = prev[key] ?? { start: startTime, end: endTime };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, isMultiDay]);

  function updateDayTime(key: string, field: "start" | "end", value: string) {
    setDayTimes((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Podaj tytuł wydarzenia");
      return;
    }

    if (isMultiDay) {
      const days: { startsAt: string; endsAt: string }[] = [];
      for (const day of dateRange) {
        const key = format(day, "yyyy-MM-dd");
        const dt = dayTimes[key] ?? { start: startTime, end: endTime };
        const dayStart = new Date(`${key}T${dt.start}`);
        const dayEnd = new Date(`${key}T${dt.end}`);
        if (dayEnd <= dayStart) {
          setError(
            `Godzina końca musi być po początku (${format(day, "d MMM", { locale: pl })})`
          );
          return;
        }
        days.push({
          startsAt: dayStart.toISOString(),
          endsAt: dayEnd.toISOString(),
        });
      }
      setSubmitting(true);
      try {
        await onSubmit({
          title: title.trim(),
          startsAt: days[0].startsAt,
          endsAt: days[days.length - 1].endsAt,
          days,
        });
        onClose();
      } finally {
        setSubmitting(false);
      }
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
        days: [],
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border-subtle bg-surface p-5 shadow-xl">
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
              <label className="text-xs text-muted">
                {isMultiDay ? "Domyślna godzina początku" : "Godzina początku"}
              </label>
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
              <label className="text-xs text-muted">
                {isMultiDay ? "Domyślna godzina końca" : "Godzina końca"}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-subtle bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {isMultiDay && (
            <div>
              <label className="text-xs text-muted">Godziny dla każdego dnia</label>
              <p className="mt-0.5 text-[11px] text-muted/70">
                Powstanie {dateRange.length} osobnych wydarzeń — do każdego
                dnia będzie można przypisać inne osoby.
              </p>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {dateRange.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dt = dayTimes[key] ?? { start: startTime, end: endTime };
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 rounded-md border border-border-subtle bg-background px-2 py-1.5"
                    >
                      <span className="w-16 shrink-0 text-xs text-muted">
                        {format(day, "d MMM", { locale: pl })}
                      </span>
                      <input
                        type="time"
                        value={dt.start}
                        onChange={(e) => updateDayTime(key, "start", e.target.value)}
                        className="w-full rounded-md border border-border-subtle bg-surface px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none"
                      />
                      <span className="text-xs text-muted">–</span>
                      <input
                        type="time"
                        value={dt.end}
                        onChange={(e) => updateDayTime(key, "end", e.target.value)}
                        className="w-full rounded-md border border-border-subtle bg-surface px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
