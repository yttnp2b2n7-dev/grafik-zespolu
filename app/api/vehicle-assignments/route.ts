import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";

  if (!eventId || !vehicleId) {
    return NextResponse.json(
      { error: "eventId and vehicleId are required" },
      { status: 400 }
    );
  }

  const assignment = await prisma.vehicleAssignment.upsert({
    where: { eventId_vehicleId: { eventId, vehicleId } },
    create: { eventId, vehicleId },
    update: {},
    include: { vehicle: true },
  });

  return NextResponse.json(assignment, { status: 201 });
}
