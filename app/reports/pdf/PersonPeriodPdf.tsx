import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { PersonShift } from "@/lib/personShifts";
import { formatMinutesAsHours, totalMinutes } from "@/lib/personShifts";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#666", marginBottom: 4 },
  totalLine: { fontSize: 12, marginTop: 10, marginBottom: 16 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: "1 solid #333333",
    paddingBottom: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    borderBottom: "1 solid #eeeeee",
    paddingVertical: 4,
  },
  colDate: { width: "30%" },
  colTime: { width: "20%" },
  colTitle: { width: "50%" },
  headerText: { fontSize: 9, color: "#333333" },
  cellText: { fontSize: 9 },
  empty: { fontSize: 10, color: "#666", marginTop: 8 },
  notesTitle: { fontSize: 11, marginTop: 28, marginBottom: 8 },
  notesLine: {
    borderBottom: "1 solid #cccccc",
    height: 22,
  },
});

export function PersonPeriodPdf({
  personName,
  periodLabel,
  shifts,
}: {
  personName: string;
  periodLabel: string;
  shifts: PersonShift[];
}) {
  const total = totalMinutes(shifts);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Raport pracy — {personName}</Text>
        <Text style={styles.subtitle}>{periodLabel}</Text>
        <Text style={styles.subtitle}>
          Wygenerowano: {format(new Date(), "d MMMM yyyy, HH:mm", { locale: pl })}
        </Text>

        <Text style={styles.totalLine}>
          Suma przepracowanych godzin: {formatMinutesAsHours(total)} (
          {shifts.length} {shifts.length === 1 ? "zmiana" : "zmian"})
        </Text>

        {shifts.length === 0 ? (
          <Text style={styles.empty}>Brak zmian w tym okresie.</Text>
        ) : (
          <View>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerText, styles.colDate]}>Data</Text>
              <Text style={[styles.headerText, styles.colTime]}>Godziny</Text>
              <Text style={[styles.headerText, styles.colTitle]}>
                Wydarzenie
              </Text>
            </View>
            {shifts.map((s) => (
              <View key={s.key} style={styles.row} wrap={false}>
                <Text style={[styles.cellText, styles.colDate]}>
                  {format(s.start, "d MMMM yyyy, EEEE", { locale: pl })}
                </Text>
                <Text style={[styles.cellText, styles.colTime]}>
                  {format(s.start, "HH:mm")}–{format(s.end, "HH:mm")}
                </Text>
                <Text style={[styles.cellText, styles.colTitle]}>
                  {s.title}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.notesTitle}>Uwagi:</Text>
        <View style={styles.notesLine} />
        <View style={styles.notesLine} />
        <View style={styles.notesLine} />
        <View style={styles.notesLine} />
      </Page>
    </Document>
  );
}
