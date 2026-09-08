import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { PersonShift } from "@/lib/personShifts";
import {
  formatMinutesAsHours,
  groupShiftsByMonth,
  totalMinutes,
} from "@/lib/personShifts";
import { registerPdfFonts } from "./registerFonts";

registerPdfFonts();

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Lato" },
  title: { fontSize: 16, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#666", marginBottom: 4 },
  totalLine: { fontSize: 12, marginTop: 10, marginBottom: 16 },
  monthHeader: {
    fontSize: 11,
    fontWeight: "bold",
    backgroundColor: "#eeeeee",
    padding: 4,
    marginTop: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: "1 solid #333333",
    paddingBottom: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    borderBottom: "1 solid #eeeeee",
    paddingVertical: 4,
  },
  colDate: { width: "18%" },
  colTime: { width: "14%" },
  colTitle: { width: "24%" },
  colRate: { width: "14%" },
  colNotes: { width: "30%" },
  headerText: { fontSize: 9, color: "#333333" },
  cellText: { fontSize: 9 },
  monthSummary: {
    fontSize: 9,
    color: "#333333",
    marginTop: 4,
    marginBottom: 6,
  },
  empty: { fontSize: 10, color: "#666", marginTop: 8 },
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
  const months = groupShiftsByMonth(shifts);

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

        {months.length === 0 ? (
          <Text style={styles.empty}>Brak zmian w tym okresie.</Text>
        ) : (
          months.map((month) => (
            <View key={month.key}>
              <Text style={styles.monthHeader}>{month.label}</Text>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.headerText, styles.colDate]}>Data</Text>
                <Text style={[styles.headerText, styles.colTime]}>
                  Godziny
                </Text>
                <Text style={[styles.headerText, styles.colTitle]}>
                  Wydarzenie
                </Text>
                <Text style={[styles.headerText, styles.colRate]}>
                  Stawka
                </Text>
                <Text style={[styles.headerText, styles.colNotes]}>
                  Uwagi
                </Text>
              </View>
              {month.shifts.map((s) => (
                <View key={s.key} style={styles.row} wrap={false}>
                  <Text style={[styles.cellText, styles.colDate]}>
                    {format(s.start, "d MMM yyyy", { locale: pl })}
                  </Text>
                  <Text style={[styles.cellText, styles.colTime]}>
                    {format(s.start, "HH:mm")}–{format(s.end, "HH:mm")}
                  </Text>
                  <Text style={[styles.cellText, styles.colTitle]}>
                    {s.title}
                  </Text>
                  <Text style={[styles.cellText, styles.colRate]}> </Text>
                  <Text style={[styles.cellText, styles.colNotes]}> </Text>
                </View>
              ))}
              <Text style={styles.monthSummary}>
                Podsumowanie {month.label}: {month.shifts.length}{" "}
                {month.shifts.length === 1 ? "dzień" : "dni"} przepracowanych
              </Text>
            </View>
          ))
        )}
      </Page>
    </Document>
  );
}
