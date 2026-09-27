import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const vacations = await prisma.vacation.findMany({
    include: { person: true },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(vacations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const personId = typeof body.personId === "string" ? body.personId : "";
  const startDate = body.startDate ? new Date(body.startDate) : null;
  const endDate = body.endDate ? new Date(body.endDate) : null;
  const note = typeof body.note === "string" ? body.note.trim() || null : null;

  if (!personId || !startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid vacation data" }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json(
      { error: "End date must not be before start date" },
      { status: 400 }
    );
  }

  const vacation = await prisma.vacation.create({
    data: { personId, startDate, endDate, note },
    include: { person: true },
  });
  return NextResponse.json(vacation, { status: 201 });
}
