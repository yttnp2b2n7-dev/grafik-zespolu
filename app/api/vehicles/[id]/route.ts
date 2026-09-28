import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const inspectionDate = body.inspectionDate ? new Date(body.inspectionDate) : null;
  const insuranceDate = body.insuranceDate ? new Date(body.insuranceDate) : null;
  if (
    (inspectionDate && Number.isNaN(inspectionDate.getTime())) ||
    (insuranceDate && Number.isNaN(insuranceDate.getTime()))
  ) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      name,
      plateNumber:
        typeof body.plateNumber === "string" ? body.plateNumber.trim() || null : null,
      type: typeof body.type === "string" ? body.type.trim() || null : null,
      capacity: typeof body.capacity === "string" ? body.capacity.trim() || null : null,
      note: typeof body.note === "string" ? body.note.trim() || null : null,
      inspectionDate,
      insuranceDate,
    },
  });
  return NextResponse.json(vehicle);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
