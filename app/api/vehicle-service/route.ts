import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
  const startDate = body.startDate ? new Date(body.startDate) : null;
  const endDate = body.endDate ? new Date(body.endDate) : null;

  if (
    !vehicleId ||
    !startDate ||
    !endDate ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return NextResponse.json({ error: "Invalid service block data" }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json(
      { error: "End date must not be before start date" },
      { status: 400 }
    );
  }

  const block = await prisma.vehicleService.create({
    data: { vehicleId, startDate, endDate },
  });
  return NextResponse.json(block, { status: 201 });
}
