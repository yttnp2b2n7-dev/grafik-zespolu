import { NextRequest, NextResponse } from "next/server";
import { format, isSameDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendBulkSms } from "@/lib/serwersms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { assignments: { include: { person: true } } },
  });
  if (!event) {
    return NextResponse.json({ error: "Nie znaleziono wydarzenia" }, { status: 404 });
  }

  const withPhone = event.assignments.filter((a) => a.person.phone);
  const withoutPhone = event.assignments.filter((a) => !a.person.phone);

  if (withPhone.length === 0) {
    return NextResponse.json(
      { error: "Żadna przypisana osoba nie ma podanego numeru telefonu" },
      { status: 400 }
    );
  }

  const start = event.startsAt;
  const end = event.endsAt;
  const timeLabel = isSameDay(start, end)
    ? `${format(start, "d.MM")} ${format(start, "HH:mm")}-${format(end, "HH:mm")}`
    : `${format(start, "d.MM HH:mm")}-${format(end, "d.MM HH:mm")}`;
  const text = `Przypisanie: ${event.title}, ${timeLabel}. Grafik ImpactVision`;

  try {
    const result = await sendBulkSms(
      withPhone.map((a) => a.person.phone as string),
      text
    );
    return NextResponse.json({
      sent: withPhone.length,
      skipped: withoutPhone.map((a) => a.person.name),
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Błąd wysyłki SMS" },
      { status: 502 }
    );
  }
}
