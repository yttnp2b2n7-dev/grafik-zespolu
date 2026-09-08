import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDaysInput } from "@/lib/eventDaysValidation";
import { randomEventColor } from "@/lib/eventColors";
import { parseLoadingTransportInput } from "@/lib/eventLoadingTransport";
import { parseEventTypesInput } from "@/lib/eventType";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");

  const where =
    weekStart && weekEnd
      ? {
          startsAt: { lt: new Date(weekEnd) },
          endsAt: { gt: new Date(weekStart) },
        }
      : {};

  const events = await prisma.event.findMany({
    where,
    include: {
      assignments: {
        include: { person: { include: { skills: { include: { skill: true } } } } },
      },
    },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const color =
    typeof body.color === "string" ? body.color : randomEventColor();

  if (!title) {
    return NextResponse.json({ error: "Invalid event data" }, { status: 400 });
  }

  const loadingTransport = parseLoadingTransportInput(body);
  const eventTypes = parseEventTypesInput(body.eventTypes);
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

  // Multi-day creation: one independent event per day, numbered "Title i/N",
  // so each day can be assigned different people.
  if (Array.isArray(body.days) && body.days.length > 1) {
    const days = parseDaysInput(body.days);
    if (!days) {
      return NextResponse.json({ error: "Invalid days data" }, { status: 400 });
    }
    const total = days.length;
    const groupId = crypto.randomUUID();
    const events = await prisma.$transaction(
      days.map((d, i) =>
        prisma.event.create({
          data: {
            title: `${title} ${i + 1}/${total}`,
            startsAt: d.startsAt,
            endsAt: d.endsAt,
            color,
            groupId,
            eventTypes,
            notes,
            ...loadingTransport,
          },
        })
      )
    );
    return NextResponse.json(events, { status: 201 });
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

  const event = await prisma.event.create({
    data: {
      title,
      startsAt,
      endsAt,
      color,
      eventTypes,
      notes,
      ...loadingTransport,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
