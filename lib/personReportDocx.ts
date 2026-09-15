import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { PersonShift } from "@/lib/personShifts";
import {
  formatMinutesAsHours,
  groupShiftsByMonth,
  totalMinutes,
} from "@/lib/personShifts";

// A4 content width in twips (11906 page width - 1440*2 margins), split into
// absolute column widths. The `docx` library needs an explicit tblGrid to
// render reliably in Word - relying on percentage-only cell widths leaves it
// to generate its own (tiny, mismatched) grid, which is what caused rows to
// render as garbled/overlapping text.
const COL = { date: 1625, time: 1264, title: 2166, rate: 1264, notes: 2708 };
const TABLE_WIDTH = COL.date + COL.time + COL.title + COL.rate + COL.notes;
const COLUMN_COUNT = 5;

const rowBorder = {
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
};

function headerCell(text: string, size: number) {
  return new TableCell({
    width: { size, type: WidthType.DXA },
    borders: rowBorder,
    children: [
      new Paragraph({ children: [new TextRun({ text, bold: true })] }),
    ],
  });
}

function cell(text: string, size: number) {
  return new TableCell({
    width: { size, type: WidthType.DXA },
    borders: rowBorder,
    children: [new Paragraph(text)],
  });
}

function spanningCell(text: string, bold: boolean, shading?: string) {
  return new TableCell({
    columnSpan: COLUMN_COUNT,
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    shading: shading ? { fill: shading } : undefined,
    borders: rowBorder,
    children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
  });
}

export async function buildPersonReportDocx(
  personName: string,
  periodLabel: string,
  shifts: PersonShift[]
): Promise<Blob> {
  const total = totalMinutes(shifts);
  const months = groupShiftsByMonth(shifts);

  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        headerCell("Data", COL.date),
        headerCell("Godziny", COL.time),
        headerCell("Wydarzenie", COL.title),
        headerCell("Stawka", COL.rate),
        headerCell("Uwagi", COL.notes),
      ],
    }),
  ];

  for (const month of months) {
    tableRows.push(
      new TableRow({ children: [spanningCell(month.label, true, "EEEEEE")] })
    );
    for (const s of month.shifts) {
      tableRows.push(
        new TableRow({
          children: [
            cell(format(s.start, "d MMM yyyy", { locale: pl }), COL.date),
            cell(`${format(s.start, "HH:mm")}–${format(s.end, "HH:mm")}`, COL.time),
            cell(s.title, COL.title),
            cell("", COL.rate),
            cell("", COL.notes),
          ],
        })
      );
    }
    tableRows.push(
      new TableRow({
        children: [
          spanningCell(
            `Podsumowanie ${month.label}: ${month.shifts.length} ${
              month.shifts.length === 1 ? "dzień" : "dni"
            } przepracowanych`,
            false
          ),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(`Raport pracy — ${personName}`)],
          }),
          new Paragraph({ text: periodLabel, spacing: { after: 100 } }),
          new Paragraph({
            text: `Wygenerowano: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: pl })}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Suma przepracowanych godzin: ${formatMinutesAsHours(total)} (${shifts.length} ${shifts.length === 1 ? "zmiana" : "zmian"})`,
                bold: true,
              }),
            ],
            spacing: { after: 200 },
          }),
          shifts.length === 0
            ? new Paragraph({ text: "Brak zmian w tym okresie." })
            : new Table({
                width: { size: TABLE_WIDTH, type: WidthType.DXA },
                columnWidths: [COL.date, COL.time, COL.title, COL.rate, COL.notes],
                rows: tableRows,
              }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
