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
} from "docx";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { PersonShift } from "@/lib/personShifts";
import {
  formatMinutesAsHours,
  groupShiftsByMonth,
  totalMinutes,
} from "@/lib/personShifts";

const COL = { date: 22, time: 16, title: 30, notes: 32 };

function headerCell(text: string, size: number) {
  return new TableCell({
    width: { size, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({ children: [new TextRun({ text, bold: true })] }),
    ],
  });
}

function cell(text: string, size: number) {
  return new TableCell({
    width: { size, type: WidthType.PERCENTAGE },
    children: [new Paragraph(text)],
  });
}

function spanningCell(text: string, bold: boolean, shading?: string) {
  return new TableCell({
    columnSpan: 4,
    width: { size: 100, type: WidthType.PERCENTAGE },
    shading: shading ? { fill: shading } : undefined,
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
            } przepracowanych, ${formatMinutesAsHours(totalMinutes(month.shifts))}`,
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
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: tableRows,
              }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
