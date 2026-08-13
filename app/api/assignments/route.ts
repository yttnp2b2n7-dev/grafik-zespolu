import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  const personId = typeof body.personId === "string" ? body.personId : "";

  if (!eventId || !personId) {
    return NextResponse.json(
      { error: "eventId and personId are required" },
      { status: 400 }
    );
  }

  const assignment = await prisma.assignment.upsert({
    where: { eventId_personId: { eventId, personId } },
    create: { eventId, personId },
    update: {},
    include: { person: true },
  });

  return NextResponse.json(assignment, { status: 201 });
}
