import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Event } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#666", marginBottom: 18 },
  eventBlock: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1 solid #dddddd",
  },
  eventTitle: { fontSize: 12, marginBottom: 2 },
  eventMeta: { fontSize: 9, color: "#555555", marginBottom: 3 },
  person: { fontSize: 9, marginTop: 2 },
  empty: { fontSize: 10, color: "#666" },
});

function eventTimeLabel(event: Event) {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  return isSameDay(start, end)
    ? `${format(start, "d MMMM yyyy, EEEE", { locale: pl })} · ${format(start, "HH:mm")}–${format(end, "HH:mm")}`
    : `${format(start, "d MMM yyyy HH:mm", { locale: pl })} – ${format(end, "d MMM yyyy HH:mm", { locale: pl })}`;
}

export function TeamPeriodPdf({
  periodLabel,
  events,
}: {
  periodLabel: string;
  events: Event[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Raport zespołu: {periodLabel}</Text>
        <Text style={styles.subtitle}>
          Wygenerowano: {format(new Date(), "d MMMM yyyy, HH:mm", { locale: pl })}
        </Text>

        {events.length === 0 && (
          <Text style={styles.empty}>Brak wydarzeń w tym okresie.</Text>
        )}

        {events.map((event) => (
          <View key={event.id} style={styles.eventBlock} wrap={false}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventMeta}>{eventTimeLabel(event)}</Text>
            <Text style={styles.person}>
              Przypisani:{" "}
              {event.assignments.map((a) => a.person.name).join(", ") ||
                "brak"}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
