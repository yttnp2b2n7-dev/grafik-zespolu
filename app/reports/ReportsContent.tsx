"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";
import { EventReport } from "./EventReport";

export function ReportsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event");

  if (eventId) {
    return <SingleEventReport eventId={eventId} />;
  }
  return <WeekReport />;
}

function SingleEventReport({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      fetch(`/api/events/${eventId}`).then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
        } else {
          setNotFound(false);
          setEvent(await res.json());
        }
        if (showLoading) setLoading(false);
      });
    };
    load(true);
    const interval = setInterval(() => load(false), 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/reports"
        className="text-xs text-muted transition hover:text-foreground"
      >
        ← Wróć do raportu tygodnia
      </Link>
      <h1 className="mt-3 text-xl font-semibold text-foreground">
        Raport wydarzenia
      </h1>

      <div className="mt-6">
        {loading && <p className="text-sm text-muted">Ładowanie…</p>}
        {!loading && notFound && (
          <p className="text-sm text-muted">Nie znaleziono wydarzenia.</p>
        )}
        {!loading && event && <EventReport event={event} />}
      </div>
    </div>
  );
}

function WeekReport() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    const weekEnd = addDays(weekStart, 7);
    const res = await fetch(
      `/api/events?weekStart=${weekStart.toISOString()}&weekEnd=${weekEnd.toISOString()}`
    );
    setEvents(await res.json());
  }, [weekStart]);

  useEffect(() => {
    setLoading(true);
    loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  useEffect(() => {
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold text-foreground">
        Raport tygodnia
      </h1>
      <p className="mt-1 text-sm text-muted">
        Wszystkie wydarzenia z wybranego tygodnia wraz z przypisanymi osobami.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => setWeekStart((d) => subWeeks(d, 1))}
          className="rounded-md border border-border-subtle px-2.5 py-1.5 text-sm text-muted hover:border-accent hover:text-foreground"
          aria-label="Poprzedni tydzień"
        >
          ←
        </button>
        <div className="text-sm text-foreground">
          {format(weekStart, "d MMM", { locale: pl })} –{" "}
          {format(addDays(weekStart, 6), "d MMM yyyy", { locale: pl })}
        </div>
        <button
          onClick={() => setWeekStart((d) => addWeeks(d, 1))}
          className="rounded-md border border-border-subtle px-2.5 py-1.5 text-sm text-muted hover:border-accent hover:text-foreground"
          aria-label="Następny tydzień"
        >
          →
        </button>
        <button
          onClick={() =>
            setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
          }
          className="rounded-md px-2.5 py-1.5 text-xs text-muted hover:text-foreground"
        >
          Dziś
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {loading && <p className="text-sm text-muted">Ładowanie…</p>}
        {!loading && events.length === 0 && (
          <p className="text-sm text-muted">
            Brak wydarzeń w tym tygodniu.
          </p>
        )}
        {events.map((event) => (
          <EventReport key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
