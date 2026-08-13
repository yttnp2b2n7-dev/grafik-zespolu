import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const endsAt = body.endsAt ? new Date(body.endsAt) : null;
  const color = typeof body.color === "string" ? body.color : null;

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

  const event = await prisma.event.create({
    data: { title, startsAt, endsAt, color },
  });
  return NextResponse.json(event, { status: 201 });
}
