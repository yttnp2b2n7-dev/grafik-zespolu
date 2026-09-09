import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { subMonths, startOfMonth, format } from "date-fns";
import { pl } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { computePersonShifts } from "@/lib/personShifts";
import { getResendClient, getReportFromAddress } from "@/lib/resend";
import { registerPdfFontsServer } from "@/app/reports/pdf/registerFonts";
import { PersonPeriodPdf } from "@/app/reports/pdf/PersonPeriodPdfBase";
import type { Event } from "@/lib/types";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  registerPdfFontsServer();

  const now = new Date();
  const periodStart = startOfMonth(subMonths(now, 1));
  const periodEnd = startOfMonth(now);
  const rawLabel = format(periodStart, "LLLL yyyy", { locale: pl });
  const periodLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  const [events, people] = await Promise.all([
    prisma.event.findMany({
      where: {
        startsAt: { lt: periodEnd },
        endsAt: { gt: periodStart },
      },
      include: {
        assignments: {
          include: {
            person: { include: { skills: { include: { skill: true } } } },
          },
        },
      },
    }),
    prisma.person.findMany({ where: { email: { not: null } } }),
  ]);

  const resend = getResendClient();
  const from = getReportFromAddress();

  const results: { person: string; status: string }[] = [];

  for (const person of people) {
    const shifts = computePersonShifts(events as unknown as Event[], person.id);
    if (shifts.length === 0) {
      results.push({ person: person.name, status: "skipped (no shifts)" });
      continue;
    }

    const pdfBuffer = await renderToBuffer(
      <PersonPeriodPdf
        personName={person.name}
        periodLabel={periodLabel}
        shifts={shifts}
      />
    );

    try {
      await resend.emails.send({
        from,
        to: person.email as string,
        subject: `Raport pracy – ${periodLabel}`,
        text: `Cześć ${person.name},\n\nW załączniku znajdziesz raport przepracowanych zmian za ${periodLabel}.\n\nGrafik ImpactVision`,
        attachments: [
          {
            filename: `raport-${periodLabel.toLowerCase().replace(/\s+/g, "-")}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
      results.push({ person: person.name, status: "sent" });
    } catch (err) {
      results.push({
        person: person.name,
        status: `error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return NextResponse.json({ periodLabel, results });
}
