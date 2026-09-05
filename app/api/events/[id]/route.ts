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

  if (!title) {
    return NextResponse.json({ error: "Invalid event data" }, { status: 400 });
  }

  // Turning a single event into a multi-day range on edit: keep this
  // event as day 1 and create independent events for the extra days,
  // same as multi-day creation.
  if (Array.isArray(body.days) && body.days.length > 1) {
    const days = parseDaysInput(body.days);
    if (!days) {
      return NextResponse.json({ error: "Invalid days data" }, { status: 400 });
    }
    const total = days.length;
    const [first, ...rest] = days;
    const events = await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: {
          title: `${title} 1/${total}`,
          startsAt: first.startsAt,
          endsAt: first.endsAt,
        },
      }),
      ...rest.map((d, i) =>
        prisma.event.create({
          data: {
            title: `${title} ${i + 2}/${total}`,
            startsAt: d.startsAt,
            endsAt: d.endsAt,
          },
        })
      ),
    ]);
    return NextResponse.json(events);
  }

  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const endsAt = body.endsAt ? new Date(body.endsAt) : null;

  if (
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

  const event = await prisma.event.update({
    where: { id },
    data: { title, startsAt, endsAt },
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
