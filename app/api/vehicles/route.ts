import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { name: "asc" },
    include: { serviceBlocks: { orderBy: { startDate: "asc" } } },
  });
  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Invalid vehicle data" }, { status: 400 });
  }

  const plateNumber =
    typeof body.plateNumber === "string" ? body.plateNumber.trim() || null : null;
  const type = typeof body.type === "string" ? body.type.trim() || null : null;
  const capacity = typeof body.capacity === "string" ? body.capacity.trim() || null : null;
  const note = typeof body.note === "string" ? body.note.trim() || null : null;
  const inspectionDate = body.inspectionDate ? new Date(body.inspectionDate) : null;
  const insuranceDate = body.insuranceDate ? new Date(body.insuranceDate) : null;

  if (
    (inspectionDate && Number.isNaN(inspectionDate.getTime())) ||
    (insuranceDate && Number.isNaN(insuranceDate.getTime()))
  ) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.create({
    data: { name, plateNumber, type, capacity, note, inspectionDate, insuranceDate },
  });
  return NextResponse.json(vehicle, { status: 201 });
}
