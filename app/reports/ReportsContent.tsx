"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { pl } from "date-fns/locale";
import type { Event, Person } from "@/lib/types";
import { EventReport } from "./EventReport";
import { formatWeekReportText } from "@/lib/eventReportText";
import { fetchJsonOrNull } from "@/lib/clientFetch";
import {
  computePersonShifts,
  formatMinutesAsHours,
  totalMinutes,
  type PersonShift,
} from "@/lib/personShifts";
import { downloadBlob } from "@/lib/downloadBlob";

export function ReportsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event");

  if (eventId) {
    return <SingleEventReport eventId={eventId} />;
  }
  return <PeriodReport />;
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
        ← Wróć do raportu okresu
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

type PeriodType = "week" | "month" | "year";

function periodRange(type: PeriodType, ref: Date) {
  if (type === "week") {
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    return { start, end: addDays(start, 7) };
  }
  if (type === "month") {
    const start = startOfMonth(ref);
    return { start, end: startOfMonth(addMonths(start, 1)) };
  }
  const start = startOfYear(ref);
  return { start, end: startOfYear(addYears(start, 1)) };
}

function periodLabel(type: PeriodType, ref: Date) {
  if (type === "week") {
    const { start, end } = periodRange(type, ref);
    return `${format(start, "d MMM", { locale: pl })} – ${format(addDays(end, -1), "d MMM yyyy", { locale: pl })}`;
  }
  if (type === "month") {
    const text = format(ref, "LLLL yyyy", { locale: pl });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return format(ref, "yyyy", { locale: pl });
}

function shiftPeriod(type: PeriodType, ref: Date, direction: 1 | -1) {
  if (type === "week") return direction === 1 ? addWeeks(ref, 1) : subWeeks(ref, 1);
  if (type === "month") return direction === 1 ? addMonths(ref, 1) : subMonths(ref, 1);
  return direction === 1 ? addYears(ref, 1) : subYears(ref, 1);
}

function slug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  week: "Tydzień",
  month: "Miesiąc",
  year: "Rok",
};

function PeriodReport() {
  const [periodType, setPeriodType] = useState<PeriodType>("week");
  const [refDate, setRefDate] = useState(() => new Date());
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState<string>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState<"pdf" | "word" | null>(null);

  const { start, end } = useMemo(
    () => periodRange(periodType, refDate),
    [periodType, refDate]
  );
  const label = useMemo(
    () => periodLabel(periodType, refDate),
    [periodType, refDate]
  );

  const loadEvents = useCallback(async () => {
    const data = await fetchJsonOrNull<Event[]>(
      `/api/events?weekStart=${start.toISOString()}&weekEnd=${end.toISOString()}`
    );
    if (data) setEvents(data);
  }, [start, end]);

  useEffect(() => {
    fetchJsonOrNull<Person[]>("/api/people").then((data) => {
      if (data) setPeople(data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  useEffect(() => {
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  const selectedPerson = people.find((p) => p.id === personId) ?? null;
  const shifts: PersonShift[] = selectedPerson
    ? computePersonShifts(events, selectedPerson.id)
    : [];

  async function handleCopy() {
    const text = selectedPerson
      ? formatPersonReportText(selectedPerson.name, label, shifts)
      : formatWeekReportText(events, label);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleDownloadPdf() {
    setGenerating("pdf");
    try {
      const { pdf } = await import("@react-pdf/renderer");
      if (selectedPerson) {
        const { PersonPeriodPdf } = await import("./pdf/PersonPeriodPdf");
        const blob = await pdf(
          <PersonPeriodPdf
            personName={selectedPerson.name}
            periodLabel={label}
            shifts={shifts}
          />
        ).toBlob();
        downloadBlob(blob, `raport-${slug(selectedPerson.name)}-${slug(label)}.pdf`);
      } else {
        const { TeamPeriodPdf } = await import("./pdf/TeamPeriodPdf");
        const blob = await pdf(
          <TeamPeriodPdf periodLabel={label} events={events} />
        ).toBlob();
        downloadBlob(blob, `raport-zespolu-${slug(label)}.pdf`);
      }
    } finally {
      setGenerating(null);
    }
  }

  async function handleDownloadWord() {
    if (!selectedPerson) return;
    setGenerating("word");
    try {
      const { buildPersonReportDocx } = await import("@/lib/personReportDocx");
      const blob = await buildPersonReportDocx(selectedPerson.name, label, shifts);
      downloadBlob(blob, `raport-${slug(selectedPerson.name)}-${slug(label)}.docx`);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Raporty</h1>
          <p className="mt-1 text-sm text-muted">
            Wybierz okres i (opcjonalnie) osobę, żeby wygenerować raport.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
        >
          {copied ? "Skopiowano" : "Kopiuj"}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((type) => (
          <button
            key={type}
            onClick={() => setPeriodType(type)}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              periodType === type
                ? "bg-accent/15 text-accent-hover"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {PERIOD_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setRefDate((d) => shiftPeriod(periodType, d, -1))}
          className="rounded-md border border-border-subtle px-2.5 py-1.5 text-sm text-muted hover:border-accent hover:text-foreground"
          aria-label="Poprzedni okres"
        >
          ←
        </button>
        <div className="min-w-[140px] text-sm text-foreground">{label}</div>
        <button
          onClick={() => setRefDate((d) => shiftPeriod(periodType, d, 1))}
          className="rounded-md border border-border-subtle px-2.5 py-1.5 text-sm text-muted hover:border-accent hover:text-foreground"
          aria-label="Następny okres"
        >
          →
        </button>
        <button
          onClick={() => setRefDate(new Date())}
          className="rounded-md px-2.5 py-1.5 text-xs text-muted hover:text-foreground"
        >
          Dziś
        </button>

        <select
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          className="ml-auto rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="all">Wszyscy</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleDownloadPdf}
          disabled={generating !== null}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
        >
          {generating === "pdf" ? "Generowanie…" : "Pobierz PDF"}
        </button>
        {selectedPerson && (
          <button
            onClick={handleDownloadWord}
            disabled={generating !== null}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground disabled:opacity-50"
          >
            {generating === "word" ? "Generowanie…" : "Pobierz Word"}
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {loading && <p className="text-sm text-muted">Ładowanie…</p>}

        {!loading && selectedPerson && (
          <div className="rounded-lg border border-border-subtle bg-surface p-5">
            <p className="text-sm font-medium text-foreground">
              Suma przepracowanych godzin: {formatMinutesAsHours(totalMinutes(shifts))}
            </p>
            <p className="mt-1 text-xs text-muted">
              {shifts.length} {shifts.length === 1 ? "zmiana" : "zmian"} w
              wybranym okresie
            </p>
            {shifts.length === 0 ? (
              <p className="mt-3 text-sm text-muted/60">Brak zmian w tym okresie.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-1.5">
                {shifts.map((s) => (
                  <li
                    key={s.eventId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-background px-3 py-1.5 text-sm"
                  >
                    <span className="text-foreground">{s.title}</span>
                    <span className="text-xs text-muted">
                      {format(s.start, "d MMM yyyy", { locale: pl })} ·{" "}
                      {format(s.start, "HH:mm")}–{format(s.end, "HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!loading && !selectedPerson && (
          <>
            {events.length === 0 && (
              <p className="text-sm text-muted">Brak wydarzeń w tym okresie.</p>
            )}
            {events.map((event) => (
              <EventReport key={event.id} event={event} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function formatPersonReportText(
  personName: string,
  label: string,
  shifts: PersonShift[]
): string {
  const header = `Raport pracy — ${personName} (${label})`;
  const total = `Suma godzin: ${formatMinutesAsHours(totalMinutes(shifts))}`;
  if (shifts.length === 0) {
    return `${header}\n${total}\n\nBrak zmian w tym okresie.`;
  }
  const lines = shifts.map(
    (s) =>
      `${format(s.start, "d MMMM yyyy", { locale: pl })}, ${format(s.start, "HH:mm")}–${format(s.end, "HH:mm")} — ${s.title}`
  );
  return `${header}\n${total}\n\n${lines.join("\n")}`;
}
