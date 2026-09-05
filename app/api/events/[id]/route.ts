import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDaysInput } from "@/lib/eventDaysValidation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { person: { include: { skills: { include: { skill: true } } } } },
      },
      days: { orderBy: { startsAt: "asc" } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const endsAt = body.endsAt ? new Date(body.endsAt) : null;

  if (
    !title ||
    !startsAt ||
    !endsAt ||
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime())
  ) {
    return NextResponse.json({ error: "Invalid event data" }, { status: 400 });
  }
  if (endsAt <= startsAt) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    );
  }

  let days: ReturnType<typeof parseDaysInput> = [];
  if (body.days !== undefined) {
    const parsed = parseDaysInput(body.days);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid days data" }, { status: 400 });
    }
    days = parsed;
  }

  const event = await prisma.$transaction(async (tx) => {
    await tx.eventDay.deleteMany({ where: { eventId: id } });
    return tx.event.update({
      where: { id },
      data: {
        title,
        startsAt,
        endsAt,
        days:
          days && days.length > 0
            ? {
                create: days.map((d) => ({
                  startsAt: d.startsAt,
                  endsAt: d.endsAt,
                })),
              }
            : undefined,
      },
      include: { days: { orderBy: { startsAt: "asc" } } },
    });
  });

  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
