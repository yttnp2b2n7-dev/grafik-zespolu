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
import { formatMinutesAsHours, totalMinutes } from "@/lib/personShifts";

function headerCell(text: string) {
  return new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({ children: [new TextRun({ text, bold: true })] }),
    ],
  });
}

function cell(text: string) {
  return new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    children: [new Paragraph(text)],
  });
}

export async function buildPersonReportDocx(
  personName: string,
  periodLabel: string,
  shifts: PersonShift[]
): Promise<Blob> {
  const total = totalMinutes(shifts);

  const rows = [
    new TableRow({
      children: [headerCell("Data"), headerCell("Godziny"), headerCell("Wydarzenie")],
    }),
    ...shifts.map(
      (s) =>
        new TableRow({
          children: [
            cell(format(s.start, "d MMMM yyyy, EEEE", { locale: pl })),
            cell(`${format(s.start, "HH:mm")}–${format(s.end, "HH:mm")}`),
            cell(s.title),
          ],
        })
    ),
  ];

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
                rows,
              }),
          new Paragraph({ text: "", spacing: { before: 400 } }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("Uwagi")],
          }),
          ...Array.from(
            { length: 5 },
            () =>
              new Paragraph({
                text: "",
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: "CCCCCC",
                  },
                },
                spacing: { after: 200 },
              })
          ),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
