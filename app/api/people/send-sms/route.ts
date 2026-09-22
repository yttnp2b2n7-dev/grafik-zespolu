import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBulkSms } from "@/lib/serwersms";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const personIds = body.personIds as string[] | undefined;
  const text = body.text as string | undefined;

  if (!personIds || personIds.length === 0 || !text || !text.trim()) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const people = await prisma.person.findMany({
    where: { id: { in: personIds } },
  });

  const withPhone = people.filter((p) => p.phone);
  const withoutPhone = people.filter((p) => !p.phone);

  if (withPhone.length === 0) {
    return NextResponse.json(
      { error: "Żadna z zaznaczonych osób nie ma podanego numeru telefonu" },
      { status: 400 }
    );
  }

  try {
    const result = await sendBulkSms(
      withPhone.map((p) => p.phone as string),
      text
    );
    return NextResponse.json({
      sent: withPhone.length,
      skipped: withoutPhone.map((p) => p.name),
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Błąd wysyłki SMS" },
      { status: 502 }
    );
  }
}
