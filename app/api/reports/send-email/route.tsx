import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { computePersonShifts } from "@/lib/personShifts";
import { getResendClient, getReportFromAddress } from "@/lib/resend";
import { registerPdfFontsServer } from "@/app/reports/pdf/registerFonts";
import { PersonPeriodPdf } from "@/app/reports/pdf/PersonPeriodPdfBase";
import { buildPersonReportDocx } from "@/lib/personReportDocx";
import type { Event } from "@/lib/types";

function slug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const personId = body.personId as string | undefined;
  const periodLabel = body.periodLabel as string | undefined;
  const from = body.from ? new Date(body.from) : null;
  const to = body.to ? new Date(body.to) : null;

  if (!personId || !periodLabel || !from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }
  if (from >= to) {
    return NextResponse.json({ error: "Zakres dat jest nieprawidłowy" }, { status: 400 });
  }

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) {
    return NextResponse.json({ error: "Nie znaleziono osoby" }, { status: 404 });
  }
  if (!person.email) {
    return NextResponse.json(
      { error: "Ta osoba nie ma podanego adresu e-mail" },
      { status: 400 }
    );
  }

  const events = await prisma.event.findMany({
    where: { startsAt: { lt: to }, endsAt: { gt: from } },
    include: {
      assignments: {
        include: { person: { include: { skills: { include: { skill: true } } } } },
      },
    },
  });

  const shifts = computePersonShifts(events as unknown as Event[], personId);
  if (shifts.length === 0) {
    return NextResponse.json(
      { error: "Brak zmian tej osoby w wybranym okresie" },
      { status: 400 }
    );
  }

  registerPdfFontsServer();
  const pdfBuffer = await renderToBuffer(
    <PersonPeriodPdf personName={person.name} periodLabel={periodLabel} shifts={shifts} />
  );
  const docxBlob = await buildPersonReportDocx(person.name, periodLabel, shifts);
  const docxBuffer = Buffer.from(await docxBlob.arrayBuffer());
  const filenameBase = `raport-${slug(person.name)}-${slug(periodLabel)}`;

  const resend = getResendClient();
  try {
    await resend.emails.send({
      from: getReportFromAddress(),
      to: person.email,
      subject: `Raport pracy – ${periodLabel}`,
      text: `Cześć ${person.name},\n\nW załączniku znajdziesz raport przepracowanych zmian za okres: ${periodLabel} w dwóch formatach — PDF oraz Word (edytowalny, gdybyś chciał/a dopisać swoje uwagi).\n\nGrafik ImpactVision`,
      attachments: [
        { filename: `${filenameBase}.pdf`, content: pdfBuffer },
        { filename: `${filenameBase}.docx`, content: docxBuffer },
      ],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Błąd wysyłki" },
      { status: 502 }
    );
  }

  return NextResponse.json({ status: "sent", to: person.email });
}
